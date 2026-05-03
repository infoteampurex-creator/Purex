import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { FALLBACK_EXPERTS } from '@/lib/constants';
import { type AdminBooking } from '@/lib/data/admin-mock';

/**
 * Read bookings from Supabase for the admin panel.
 *
 * Production behaviour:
 *   - Attempt Supabase query
 *   - Return real rows when present
 *   - Return EMPTY array (with source label) when DB is empty or unreachable
 *
 * Demo data is no longer mixed into the panel — admins always see truth.
 */

interface FetchResult {
  bookings: AdminBooking[];
  source: 'supabase' | 'mock' | 'error-fallback';
  error?: string;
}

export async function getAdminBookings(): Promise<FetchResult> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('bookings')
      .select(
        `id, reference_id, client_name, client_email, client_phone,
         expert_id, expert_slug, service_id, service_name,
         preferred_date, preferred_time_slot, scheduled_datetime,
         status, source, notes, created_at`
      )
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return {
        bookings: [],
        source: 'error-fallback',
        error: error.message,
      };
    }

    const real: AdminBooking[] = (rows ?? []).map(supabaseRowToAdminBooking);

    // If we have real data, show real data; otherwise empty.
    if (real.length > 0) {
      return { bookings: real, source: 'supabase' };
    }

    // DB is reachable but empty — show empty state, NOT demo data.
    return { bookings: [], source: 'mock' };
  } catch (err) {
    return {
      bookings: [],
      source: 'error-fallback',
      error: err instanceof Error ? err.message : 'Unknown Supabase error',
    };
  }
}

/**
 * Convert a Supabase bookings row into the AdminBooking shape the UI uses.
 * Resolves expert name from slug via FALLBACK_EXPERTS (since expert_id
 * FK won't be populated until admins seed the experts table).
 */
function supabaseRowToAdminBooking(row: SupabaseBookingRow): AdminBooking {
  const expert = row.expert_slug
    ? FALLBACK_EXPERTS.find((e) => e.slug === row.expert_slug)
    : undefined;

  const notes = row.notes ?? '';
  const hasPreConsultForm = notes.includes('── Pre-consult form ──');

  return {
    id: row.id,
    referenceId: row.reference_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone ?? undefined,

    expertName: expert?.name ?? row.expert_slug ?? 'Unassigned',
    expertSlug: row.expert_slug ?? 'unassigned',

    serviceName: row.service_name ?? 'Consultation',

    preferredDate: row.preferred_date ?? undefined,
    preferredTimeSlot: row.preferred_time_slot ?? undefined,
    scheduledDatetime: row.scheduled_datetime ?? undefined,

    status: (row.status as AdminBooking['status']) ?? 'new',
    source: (row.source as AdminBooking['source']) ?? 'website',
    notes: row.notes ?? undefined,
    hasPreConsultForm,

    createdAt: row.created_at,
  };
}

interface SupabaseBookingRow {
  id: string;
  reference_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  expert_id: string | null;
  expert_slug: string | null;
  service_id: string | null;
  service_name: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  scheduled_datetime: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
}
