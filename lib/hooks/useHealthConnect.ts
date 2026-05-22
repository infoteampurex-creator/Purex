'use client';

import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Wraps @kiwi-health/capacitor-health-connect for the read-only flow
 * we care about: steps, sleep duration, hydration volume, and heart
 * rate for "today" (local midnight → now).
 *
 * The plugin only works on Android. On web / iOS the hook reports
 * `availability: 'NotSupported'` and the rest is no-ops, so callers
 * can render gracefully degraded UI.
 */

const READ_TYPES = ['Steps', 'SleepSession', 'Hydration', 'HeartRateSeries'] as const;
type ReadType = (typeof READ_TYPES)[number];

export type HealthConnectAvailability =
  | 'Unknown'        // not checked yet
  | 'Available'      // installed + ready
  | 'NotInstalled'   // user needs to install Health Connect app
  | 'NotSupported';  // device / OS doesn't support it (or we're on web/iOS)

export interface HealthConnectReadings {
  steps: number;          // total steps today
  sleepMinutes: number;   // total sleep duration today (last completed session)
  waterMl: number;        // hydration logged today (ml)
  heartRateBpm: number;   // most recent heart-rate sample today (0 if none)
  /** ISO timestamp of when these readings were taken. */
  readAt: string;
}

const EMPTY_READINGS: HealthConnectReadings = {
  steps: 0,
  sleepMinutes: 0,
  waterMl: 0,
  heartRateBpm: 0,
  readAt: '',
};

interface State {
  availability: HealthConnectAvailability;
  hasPermissions: boolean;
  readings: HealthConnectReadings;
  loading: boolean;
  error: string | null;
}

const INITIAL: State = {
  availability: 'Unknown',
  hasPermissions: false,
  readings: EMPTY_READINGS,
  loading: false,
  error: null,
};

export function useHealthConnect() {
  const [state, setState] = useState<State>(INITIAL);

  /** Dynamic import keeps the native plugin out of the web bundle. */
  const loadPlugin = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return null;
    const mod = await import('@kiwi-health/capacitor-health-connect');
    return mod.HealthConnect;
  }, []);

  const checkAvailability = useCallback(async () => {
    const HC = await loadPlugin();
    if (!HC) {
      setState((s) => ({ ...s, availability: 'NotSupported' }));
      return 'NotSupported' as const;
    }
    try {
      const { availability } = await HC.checkAvailability();
      setState((s) => ({ ...s, availability }));
      return availability;
    } catch (err) {
      setState((s) => ({
        ...s,
        availability: 'NotSupported',
        error: err instanceof Error ? err.message : String(err),
      }));
      return 'NotSupported' as const;
    }
  }, [loadPlugin]);

  const checkPermissions = useCallback(async () => {
    const HC = await loadPlugin();
    if (!HC) return false;
    try {
      const result = await HC.checkHealthPermissions({
        read: [...READ_TYPES] as ReadType[],
        write: [],
      });
      setState((s) => ({ ...s, hasPermissions: result.hasAllPermissions }));
      return result.hasAllPermissions;
    } catch {
      return false;
    }
  }, [loadPlugin]);

  const requestPermissions = useCallback(async () => {
    const HC = await loadPlugin();
    if (!HC) return false;
    try {
      const result = await HC.requestHealthPermissions({
        read: [...READ_TYPES] as ReadType[],
        write: [],
      });
      setState((s) => ({ ...s, hasPermissions: result.hasAllPermissions }));
      return result.hasAllPermissions;
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : String(err),
      }));
      return false;
    }
  }, [loadPlugin]);

  const openSettings = useCallback(async () => {
    const HC = await loadPlugin();
    if (!HC) return;
    try {
      await HC.openHealthConnectSetting();
    } catch {
      // Plugin throws if Health Connect isn't installed — handled by
      // the availability flow elsewhere.
    }
  }, [loadPlugin]);

  /**
   * Read all four record types for today (local midnight → now) and
   * normalize them into HealthConnectReadings.
   */
  const readToday = useCallback(async (): Promise<HealthConnectReadings> => {
    const HC = await loadPlugin();
    if (!HC) return EMPTY_READINGS;

    setState((s) => ({ ...s, loading: true, error: null }));

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    const timeRangeFilter = {
      type: 'between' as const,
      startTime: start,
      endTime: now,
    };

    try {
      const [stepsRes, sleepRes, hydrationRes, hrRes] = await Promise.all([
        HC.readRecords({ type: 'Steps', timeRangeFilter }).catch(() => ({
          records: [],
        })),
        HC.readRecords({ type: 'SleepSession', timeRangeFilter }).catch(() => ({
          records: [],
        })),
        HC.readRecords({ type: 'Hydration', timeRangeFilter }).catch(() => ({
          records: [],
        })),
        HC.readRecords({ type: 'HeartRateSeries', timeRangeFilter }).catch(
          () => ({ records: [] })
        ),
      ]);

      // Steps: sum count across all records in the window
      const steps = stepsRes.records.reduce(
        (sum, r) => sum + ((r as { count?: number }).count ?? 0),
        0
      );

      // Sleep: sum duration across all SleepSession records today.
      // Some users have a single long overnight session; others have
      // multiple naps. We sum all of them to total minutes asleep.
      const sleepMinutes = sleepRes.records.reduce((sum, r) => {
        const session = r as { startTime?: Date | string; endTime?: Date | string };
        if (!session.startTime || !session.endTime) return sum;
        const startMs = new Date(session.startTime).getTime();
        const endMs = new Date(session.endTime).getTime();
        return sum + Math.max(0, Math.round((endMs - startMs) / 60000));
      }, 0);

      // Hydration: convert all Volume readings to ml and sum
      const waterMl = hydrationRes.records.reduce((sum, r) => {
        const h = r as {
          volume?: { unit?: string; value?: number };
        };
        const v = h.volume;
        if (!v || typeof v.value !== 'number') return sum;
        const ml = v.unit === 'liter' ? v.value * 1000 : v.value;
        return sum + Math.round(ml);
      }, 0);

      // Heart rate: take the most recent sample's bpm
      let heartRateBpm = 0;
      for (const r of hrRes.records) {
        const series = r as {
          samples?: Array<{ time?: Date | string; beatsPerMinute?: number }>;
        };
        if (!series.samples) continue;
        for (const s of series.samples) {
          if (typeof s.beatsPerMinute === 'number') {
            heartRateBpm = s.beatsPerMinute;
          }
        }
      }

      const readings: HealthConnectReadings = {
        steps,
        sleepMinutes,
        waterMl,
        heartRateBpm,
        readAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, readings, loading: false }));
      return readings;
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
      return EMPTY_READINGS;
    }
  }, [loadPlugin]);

  // On first mount, check availability + permissions
  useEffect(() => {
    (async () => {
      const avail = await checkAvailability();
      if (avail === 'Available') {
        const granted = await checkPermissions();
        if (granted) {
          void readToday();
        }
      }
    })();
  }, [checkAvailability, checkPermissions, readToday]);

  return {
    ...state,
    checkAvailability,
    checkPermissions,
    requestPermissions,
    openSettings,
    readToday,
  };
}
