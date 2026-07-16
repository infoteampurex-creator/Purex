import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type MealRow = {
  id: string;
  log_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  name: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  photo_url: string | null;
  ai_confidence: number | null;
  source: 'manual' | 'ai_photo' | 'health_connect';
  note: string | null;
  created_at: string;
};

/**
 * Returns the signed-in user's meals for a given date, most-recent
 * first. Used by the MealLogSheet to display today's entries with
 * delete affordances.
 */
export async function getTodaysMeals(
  clientId: string,
  date: string
): Promise<MealRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('client_meals')
      .select(
        'id, log_date, meal_type, name, calories, protein_g, carbs_g, fats_g, fiber_g, photo_url, ai_confidence, source, note, created_at'
      )
      .eq('client_id', clientId)
      .eq('log_date', date)
      .order('created_at', { ascending: false });

    if (error) {
      // Likely cause: 00015_meal_logging migration not applied yet.
      // We swallow + return empty so the dashboard keeps working.
      // eslint-disable-next-line no-console
      console.error('[Team Purex] getTodaysMeals failed:', error.message);
      return [];
    }
    return (data ?? []) as unknown as MealRow[];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Team Purex] getTodaysMeals threw:', err);
    return [];
  }
}
