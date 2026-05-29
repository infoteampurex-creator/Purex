import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { emptyWeeklyPlan, type WeeklyPlan } from './weekly-plan';

/**
 * Server-side: read the active weekly plan for a client.
 *
 * Returns emptyWeeklyPlan (7 rest days) when no plan exists yet —
 * lets the coach UI render the editor without a special "no plan"
 * branch. RLS allows admins to read any client's plan.
 */
export async function getWeeklyPlanForClient(
  clientId: string
): Promise<WeeklyPlan> {
  try {
    const supabase = await createClient();

    const [headRes, daysRes] = await Promise.all([
      supabase
        .from('client_weekly_plan')
        .select('client_id, name, started_at, materialize_weeks, updated_at, updated_by')
        .eq('client_id', clientId)
        .maybeSingle(),
      supabase
        .from('client_weekly_plan_days')
        .select('day_of_week, workout_template_id, override_notes')
        .eq('client_id', clientId)
        .order('day_of_week', { ascending: true }),
    ]);

    if (!headRes.data) {
      return emptyWeeklyPlan(clientId);
    }

    type DayRow = {
      day_of_week: number;
      workout_template_id: string | null;
      override_notes: string | null;
    };
    const dayRows = (daysRes.data ?? []) as DayRow[];

    // Build 7-slot day array, fill gaps with rest
    const dayMap = new Map(dayRows.map((d) => [d.day_of_week, d]));
    const days = Array.from({ length: 7 }, (_, i) => {
      const r = dayMap.get(i);
      return {
        dayOfWeek: i,
        workoutTemplateId: r?.workout_template_id ?? null,
        overrideNotes: r?.override_notes ?? null,
      };
    });

    return {
      clientId: headRes.data.client_id,
      name: headRes.data.name,
      startedAt: headRes.data.started_at,
      materializeWeeks: headRes.data.materialize_weeks,
      updatedAt: headRes.data.updated_at,
      updatedBy: headRes.data.updated_by,
      days,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[weekly-plan-server] getWeeklyPlanForClient threw', err);
    return emptyWeeklyPlan(clientId);
  }
}
