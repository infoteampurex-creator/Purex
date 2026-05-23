'use client';

import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { HealthConnect } from '@kiwi-health/capacitor-health-connect';

/**
 * Wraps @kiwi-health/capacitor-health-connect for the read-only flow
 * we care about: steps, sleep duration, hydration volume, and heart
 * rate for "today" (local midnight → now).
 *
 * The plugin only works on Android. On web / iOS the hook reports
 * `availability: 'NotSupported'` and the rest is no-ops, so callers
 * can render gracefully degraded UI.
 *
 * Every plugin call is wrapped in a timeout — Capacitor's bridge can
 * silently hang if a permission flow gets interrupted. We surface
 * those as errors instead of leaving the UI stuck on "Checking…".
 */

const READ_TYPES = ['Steps', 'SleepSession', 'Hydration', 'HeartRateSeries'] as const;
type ReadType = (typeof READ_TYPES)[number];

const CALL_TIMEOUT_MS = 8000;

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

/** Reject a promise if it doesn't settle within `ms` milliseconds. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export function useHealthConnect() {
  const [state, setState] = useState<State>(INITIAL);

  /** True only when running on an actual Android Capacitor WebView. */
  const isAndroid = useCallback(() => Capacitor.getPlatform() === 'android', []);

  const checkAvailability = useCallback(async () => {
    if (!isAndroid()) {
      setState((s) => ({ ...s, availability: 'NotSupported' }));
      return 'NotSupported' as const;
    }
    try {
      const { availability } = await withTimeout(
        HealthConnect.checkAvailability(),
        CALL_TIMEOUT_MS,
        'checkAvailability'
      );
      setState((s) => ({ ...s, availability, error: null }));
      return availability;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({
        ...s,
        availability: 'NotSupported',
        error: msg,
      }));
      return 'NotSupported' as const;
    }
  }, [isAndroid]);

  const checkPermissions = useCallback(async () => {
    if (!isAndroid()) return false;
    try {
      const result = await withTimeout(
        HealthConnect.checkHealthPermissions({
          read: [...READ_TYPES] as ReadType[],
          write: [],
        }),
        CALL_TIMEOUT_MS,
        'checkHealthPermissions'
      );
      setState((s) => ({ ...s, hasPermissions: result.hasAllPermissions }));
      return result.hasAllPermissions;
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : String(err),
      }));
      return false;
    }
  }, [isAndroid]);

  const requestPermissions = useCallback(async () => {
    if (!isAndroid()) return false;
    try {
      const result = await withTimeout(
        HealthConnect.requestHealthPermissions({
          read: [...READ_TYPES] as ReadType[],
          write: [],
        }),
        // Permission UI needs more time — user-driven
        60_000,
        'requestHealthPermissions'
      );
      setState((s) => ({ ...s, hasPermissions: result.hasAllPermissions, error: null }));
      return result.hasAllPermissions;
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : String(err),
      }));
      return false;
    }
  }, [isAndroid]);

  const openSettings = useCallback(async () => {
    if (!isAndroid()) return;
    try {
      await withTimeout(
        HealthConnect.openHealthConnectSetting(),
        CALL_TIMEOUT_MS,
        'openHealthConnectSetting'
      );
    } catch {
      // Plugin throws if Health Connect isn't installed — handled
      // separately via the availability flow.
    }
  }, [isAndroid]);

  /**
   * Read all four record types for today (local midnight → now) and
   * normalize them into HealthConnectReadings.
   */
  const readToday = useCallback(async (): Promise<HealthConnectReadings> => {
    if (!isAndroid()) return EMPTY_READINGS;

    setState((s) => ({ ...s, loading: true, error: null }));

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    const timeRangeFilter = {
      type: 'between' as const,
      startTime: start,
      endTime: now,
    };

    const safeRead = async (type: ReadType) => {
      try {
        return await withTimeout(
          HealthConnect.readRecords({ type, timeRangeFilter }),
          CALL_TIMEOUT_MS,
          `readRecords(${type})`
        );
      } catch {
        return { records: [] };
      }
    };

    try {
      const [stepsRes, sleepRes, hydrationRes, hrRes] = await Promise.all([
        safeRead('Steps'),
        safeRead('SleepSession'),
        safeRead('Hydration'),
        safeRead('HeartRateSeries'),
      ]);

      // Steps: sum count across all records in the window
      const steps = stepsRes.records.reduce(
        (sum, r) => sum + ((r as { count?: number }).count ?? 0),
        0
      );

      // Sleep: sum duration across all SleepSession records today.
      const sleepMinutes = sleepRes.records.reduce((sum, r) => {
        const session = r as { startTime?: Date | string; endTime?: Date | string };
        if (!session.startTime || !session.endTime) return sum;
        const startMs = new Date(session.startTime).getTime();
        const endMs = new Date(session.endTime).getTime();
        return sum + Math.max(0, Math.round((endMs - startMs) / 60000));
      }, 0);

      // Hydration: convert all Volume readings to ml and sum
      const waterMl = hydrationRes.records.reduce((sum, r) => {
        const h = r as { volume?: { unit?: string; value?: number } };
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
  }, [isAndroid]);

  // On first mount, check availability + permissions + auto-read
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
