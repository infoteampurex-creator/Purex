import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { FALLBACK_EXPERTS } from '@/lib/constants';
import { type AdminClient } from '@/lib/data/admin-mock';

/**
 * Read clients from Supabase for the admin panel.
 *
 * A "client" is any profile with role = 'user' that isn't a trainer.
 * The active plan and assigned coach are joined from `client_plans`
 * and `experts`, with `FALLBACK_EXPERTS` as a fallback for the coach
 * name lookup if the experts table hasn't been seeded yet.
 *
 * Returns empty array on error, with the source field set so callers
 * can distinguish between "DB unreachable" and "no clients yet".
 */

interface FetchResult {
  clients: AdminClient[];
  source: 'supabase' | 'mock' | 'error-fallback';
  error?: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_trainer: boolean | null;
  created_at: string;
}

interface PlanRow {
  client_id: string;
  plan_name: string;
  plan_tier: AdminClient['planTier'] | null;
  start_date: string | null;
  status: AdminClient['status'];
  assigned_expert_id: string | null;
  created_at: string;
}

interface ExpertRow {
  id: string;
  slug: string;
  name: string;
}

export async function getAdminClients(): Promise<FetchResult> {
  try {
    const supabase = await createClient();

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, first_name, phone, avatar_url, role, is_trainer, created_at'
      )
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(500);

    if (profilesError) {
      return {
        clients: [],
        source: 'error-fallback',
        error: profilesError.message,
      };
    }

    const clientRows = (profiles ?? []).filter(
      (p): p is ProfileRow => !p.is_trainer
    );

    if (clientRows.length === 0) {
      return { clients: [], source: 'supabase' };
    }

    // Fetch the most recent plan per client (one query, group in JS).
    const ids = clientRows.map((c) => c.id);
    const { data: plans } = await supabase
      .from('client_plans')
      .select(
        'client_id, plan_name, plan_tier, start_date, status, assigned_expert_id, created_at'
      )
      .in('client_id', ids)
      .order('created_at', { ascending: false });

    const latestPlanByClient = new Map<string, PlanRow>();
    (plans ?? []).forEach((row) => {
      const plan = row as PlanRow;
      if (!latestPlanByClient.has(plan.client_id)) {
        latestPlanByClient.set(plan.client_id, plan);
      }
    });

    // Resolve expert names. Use experts table when seeded, else fall back.
    const expertIds = Array.from(latestPlanByClient.values())
      .map((p) => p.assigned_expert_id)
      .filter((id): id is string => Boolean(id));

    const expertById = new Map<string, ExpertRow>();
    if (expertIds.length > 0) {
      const { data: experts } = await supabase
        .from('experts')
        .select('id, slug, name')
        .in('id', expertIds);
      (experts ?? []).forEach((e) => expertById.set(e.id, e as ExpertRow));
    }

    const clients: AdminClient[] = clientRows.map((p) => {
      const plan = latestPlanByClient.get(p.id);
      const expert = plan?.assigned_expert_id
        ? expertById.get(plan.assigned_expert_id)
        : undefined;

      // If expert table not seeded, try matching by slug from FALLBACK_EXPERTS
      // (no slug stored on the plan row, so this only kicks in when the
      // experts table has the row).
      const coachName = expert?.name;
      const coachSlug =
        expert?.slug ??
        FALLBACK_EXPERTS.find((e) => e.name === coachName)?.slug;

      return {
        id: p.id,
        fullName: p.full_name ?? p.first_name ?? p.email,
        email: p.email,
        phone: p.phone ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
        activePlan: plan?.plan_name,
        planTier: plan?.plan_tier ?? undefined,
        planStartDate: plan?.start_date ?? undefined,
        assignedCoachName: coachName,
        assignedCoachSlug: coachSlug,
        status: plan?.status ?? 'onboarding',
        totalBookings: 0,
        joinedAt: p.created_at,
      };
    });

    return { clients, source: 'supabase' };
  } catch (err) {
    return {
      clients: [],
      source: 'error-fallback',
      error: err instanceof Error ? err.message : 'Unknown Supabase error',
    };
  }
}
