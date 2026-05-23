import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type UnitPref = 'in' | 'cm';

export type ProfileBodySettings = {
  heightCm: number | null;
  gender: Gender | null;
  unitPref: UnitPref;
};

export const EMPTY_PROFILE_BODY_SETTINGS: ProfileBodySettings = {
  heightCm: null,
  gender: null,
  unitPref: 'in',
};

export type BodyMeasurements = {
  id: string;
  measuredAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  neckCm: number | null;
  chestCm: number | null;
  upperAbdomenCm: number | null;
  lowerAbdomenCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepLeftCm: number | null;
  bicepRightCm: number | null;
  thighLeftCm: number | null;
  thighRightCm: number | null;
  calfLeftCm: number | null;
  calfRightCm: number | null;
  note: string | null;
};

const MEAS_COLS =
  'id, measured_at, weight_kg, body_fat_pct, ' +
  'neck_cm, chest_cm, upper_abdomen_cm, lower_abdomen_cm, ' +
  'waist_cm, hips_cm, bicep_left_cm, bicep_right_cm, ' +
  'thigh_left_cm, thigh_right_cm, calf_left_cm, calf_right_cm, note';

type RawMeas = {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  neck_cm: number | null;
  chest_cm: number | null;
  upper_abdomen_cm: number | null;
  lower_abdomen_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  bicep_left_cm: number | null;
  bicep_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  note: string | null;
};

function rawToTyped(r: RawMeas): BodyMeasurements {
  return {
    id: r.id,
    measuredAt: r.measured_at,
    weightKg: r.weight_kg,
    bodyFatPct: r.body_fat_pct,
    neckCm: r.neck_cm,
    chestCm: r.chest_cm,
    upperAbdomenCm: r.upper_abdomen_cm,
    lowerAbdomenCm: r.lower_abdomen_cm,
    waistCm: r.waist_cm,
    hipsCm: r.hips_cm,
    bicepLeftCm: r.bicep_left_cm,
    bicepRightCm: r.bicep_right_cm,
    thighLeftCm: r.thigh_left_cm,
    thighRightCm: r.thigh_right_cm,
    calfLeftCm: r.calf_left_cm,
    calfRightCm: r.calf_right_cm,
    note: r.note,
  };
}

/** Latest measurement row for the user (null if none logged yet). */
export async function getLatestMeasurements(
  clientId: string
): Promise<BodyMeasurements | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('client_body_measurements')
      .select(MEAS_COLS)
      .eq('client_id', clientId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] getLatestMeasurements failed:', error.message);
      return null;
    }
    return data ? rawToTyped(data as unknown as RawMeas) : null;
  } catch {
    return null;
  }
}

/** Profile-level body settings (height, gender, unit pref). */
export async function getProfileBodySettings(
  userId: string
): Promise<ProfileBodySettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('height_cm, gender, unit_pref')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return EMPTY_PROFILE_BODY_SETTINGS;
    return {
      heightCm: (data as { height_cm: number | null }).height_cm ?? null,
      gender: ((data as { gender: Gender | null }).gender ?? null),
      unitPref:
        ((data as { unit_pref: UnitPref | null }).unit_pref as UnitPref) ?? 'in',
    };
  } catch {
    return EMPTY_PROFILE_BODY_SETTINGS;
  }
}
