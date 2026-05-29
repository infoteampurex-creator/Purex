import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  EMPTY_HEALTH_PROFILE,
  type HealthConditionsProfile,
} from './health-conditions';

/**
 * Read the health profile for a client. Returns EMPTY_HEALTH_PROFILE
 * (with the requested clientId set) when no row exists yet.
 *
 * RLS: client can read own, admin can read anyone's.
 */
export async function getHealthConditionsForClient(
  clientId: string
): Promise<HealthConditionsProfile> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('client_health_profile')
      .select(
        'client_id, conditions, allergies, injuries, medications, coach_notes, updated_at'
      )
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[health-conditions-server] fetch failed', error);
      return { ...EMPTY_HEALTH_PROFILE, clientId };
    }
    if (!data) {
      return { ...EMPTY_HEALTH_PROFILE, clientId };
    }
    return {
      clientId: data.client_id,
      conditions: (data.conditions as string[] | null) ?? [],
      allergies: (data.allergies as string[] | null) ?? [],
      injuries: (data.injuries as string[] | null) ?? [],
      medications: (data.medications as string[] | null) ?? [],
      coachNotes: data.coach_notes,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health-conditions-server] threw', err);
    return { ...EMPTY_HEALTH_PROFILE, clientId };
  }
}
