import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  type AdminEnquiry,
  type EnquiryAdminData,
  type EnquiryStatus,
  type PrimaryGoal,
  type StartTiming,
} from '@/lib/data/enquiries-types';

interface EnquiryRow {
  id: string;
  full_name: string;
  whatsapp: string;
  email: string;
  primary_goal: PrimaryGoal;
  start_timing: StartTiming;
  message: string | null;
  preferred_language: 'en' | 'hi';
  status: EnquiryStatus;
  assigned_specialist_id: string | null;
  admin_notes: string | null;
  source: string | null;
  created_at: string;
  contacted_at: string | null;
  converted_at: string | null;
  admin_data: EnquiryAdminData | null;
}

const COLS =
  'id, full_name, whatsapp, email, primary_goal, start_timing, message, ' +
  'preferred_language, status, assigned_specialist_id, admin_notes, source, ' +
  'created_at, contacted_at, converted_at, admin_data';

function rowToEnquiry(
  r: EnquiryRow,
  specialistNames: Map<string, string>
): AdminEnquiry {
  return {
    id: r.id,
    fullName: r.full_name,
    whatsapp: r.whatsapp,
    email: r.email,
    primaryGoal: r.primary_goal,
    startTiming: r.start_timing,
    message: r.message,
    preferredLanguage: r.preferred_language,
    status: r.status,
    assignedSpecialistId: r.assigned_specialist_id,
    assignedSpecialistName: r.assigned_specialist_id
      ? specialistNames.get(r.assigned_specialist_id) ?? null
      : null,
    adminNotes: r.admin_notes,
    source: r.source,
    createdAt: r.created_at,
    contactedAt: r.contacted_at,
    convertedAt: r.converted_at,
    adminData: (r.admin_data ?? {}) as EnquiryAdminData,
  };
}

export async function getAdminEnquiries(): Promise<AdminEnquiry[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('enquiries')
      .select(COLS)
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    // Resolve assigned specialist names in one query.
    const rows = data as unknown as EnquiryRow[];
    const ids = Array.from(
      new Set(
        rows
          .map((r) => r.assigned_specialist_id)
          .filter((id): id is string => !!id)
      )
    );
    const specialistNames = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ids);
      (profiles ?? []).forEach((p) => {
        specialistNames.set(
          (p as { id: string }).id,
          ((p as { full_name?: string; email?: string }).full_name ??
            (p as { email?: string }).email ??
            'Unknown') as string
        );
      });
    }

    return rows.map((r) => rowToEnquiry(r, specialistNames));
  } catch (err) {
    console.error('[enquiries] getAdminEnquiries failed', err);
    return [];
  }
}

export async function getAdminEnquiryById(
  id: string
): Promise<AdminEnquiry | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('enquiries')
      .select(COLS)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;

    const row = data as unknown as EnquiryRow;
    const specialistNames = new Map<string, string>();
    if (row.assigned_specialist_id) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', row.assigned_specialist_id)
        .maybeSingle();
      if (profile) {
        specialistNames.set(
          (profile as { id: string }).id,
          ((profile as { full_name?: string; email?: string }).full_name ??
            (profile as { email?: string }).email ??
            'Unknown') as string
        );
      }
    }
    return rowToEnquiry(row, specialistNames);
  } catch (err) {
    console.error('[enquiries] getAdminEnquiryById failed', err);
    return null;
  }
}

/** Specialists (admin users) — for the assign dropdown in detail view. */
export async function getAssignableSpecialists(): Promise<
  Array<{ id: string; name: string; email: string }>
> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['admin', 'super_admin'])
      .order('full_name', { ascending: true });
    return (data ?? []).map((p) => {
      const row = p as {
        id: string;
        full_name?: string;
        email?: string;
      };
      return {
        id: row.id,
        name: row.full_name ?? row.email ?? 'Unknown',
        email: row.email ?? '',
      };
    });
  } catch {
    return [];
  }
}

export async function getEnquiryCountByStatus(): Promise<
  Record<EnquiryStatus, number>
> {
  const out: Record<EnquiryStatus, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    rejected: 0,
  };
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('enquiries').select('status');
    (data ?? []).forEach((r) => {
      const s = (r as { status: EnquiryStatus }).status;
      if (s in out) out[s]++;
    });
    return out;
  } catch {
    return out;
  }
}
