import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { type AdminSpecialist, MOCK_SPECIALISTS } from '@/lib/data/admin-mock';

/**
 * Read specialists from Supabase for the admin panel.
 *
 * Reads `experts` (the marketing-team showcase table). For each
 * specialist, also derives `activeClients` from `client_plans` so the
 * count reflects reality, not a stored snapshot.
 *
 * Falls back to MOCK_SPECIALISTS only when the experts table is
 * completely empty (initial seed scenario). When `experts` has rows,
 * the result is always real data.
 */

export type SpecialistsSource = 'supabase' | 'mock' | 'error-fallback';

interface FetchResult {
  specialists: AdminSpecialist[];
  source: SpecialistsSource;
  error?: string;
}

interface ExpertRow {
  id: string;
  slug: string;
  name: string;
  title: string;
  short_role: string;
  location: string | null;
  clients_trained: number | null;
  calendly_url: string | null;
  photo_url: string | null;
  bio_short: string | null;
  is_active: boolean | null;
}

interface ActivePlanCountRow {
  assigned_expert_id: string | null;
}

export async function getAdminSpecialists(): Promise<FetchResult> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('experts')
      .select(
        'id, slug, name, title, short_role, location, clients_trained, calendly_url, photo_url, bio_short, is_active'
      )
      .order('display_order', { ascending: true });

    if (error) {
      return {
        specialists: MOCK_SPECIALISTS,
        source: 'error-fallback',
        error: error.message,
      };
    }

    if (!rows || rows.length === 0) {
      return { specialists: MOCK_SPECIALISTS, source: 'mock' };
    }

    // Active client counts: one query, group by expert id.
    const { data: planRows } = await supabase
      .from('client_plans')
      .select('assigned_expert_id')
      .eq('status', 'active');

    const activeByExpertId = new Map<string, number>();
    (planRows ?? []).forEach((row) => {
      const r = row as ActivePlanCountRow;
      if (!r.assigned_expert_id) return;
      activeByExpertId.set(
        r.assigned_expert_id,
        (activeByExpertId.get(r.assigned_expert_id) ?? 0) + 1
      );
    });

    const specialists: AdminSpecialist[] = (rows as ExpertRow[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      title: r.title,
      shortRole: r.short_role,
      location: r.location ?? '',
      clientsTrained: r.clients_trained ?? 0,
      activeClients: activeByExpertId.get(r.id) ?? 0,
      calendlyUrl: r.calendly_url ?? undefined,
      isActive: r.is_active !== false,
    }));

    return { specialists, source: 'supabase' };
  } catch (err) {
    return {
      specialists: MOCK_SPECIALISTS,
      source: 'error-fallback',
      error: err instanceof Error ? err.message : 'Unknown Supabase error',
    };
  }
}

/**
 * Fetch the assigned clients for a single expert. Used by the
 * "View clients" modal on the specialists page.
 */
export interface SpecialistClient {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  planName: string | null;
  status: string;
}

export async function getSpecialistClients(
  expertId: string
): Promise<SpecialistClient[]> {
  try {
    const supabase = await createClient();

    const { data: rows } = await supabase
      .from('client_plans')
      .select(
        'plan_name, status, profiles:client_id (id, full_name, email, phone)'
      )
      .eq('assigned_expert_id', expertId)
      .order('created_at', { ascending: false });

    return (rows ?? [])
      .map((row) => {
        const r = row as unknown as {
          plan_name: string | null;
          status: string;
          profiles:
            | { id: string; full_name: string | null; email: string; phone: string | null }
            | { id: string; full_name: string | null; email: string; phone: string | null }[]
            | null;
        };
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        if (!profile) return null;
        return {
          id: profile.id,
          fullName: profile.full_name ?? profile.email,
          email: profile.email,
          phone: profile.phone,
          planName: r.plan_name,
          status: r.status,
        };
      })
      .filter((c): c is SpecialistClient => c !== null);
  } catch {
    return [];
  }
}
