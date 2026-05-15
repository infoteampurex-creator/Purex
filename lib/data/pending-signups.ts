import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface PendingSignup {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  phone: string | null;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  phone: string | null;
  created_at: string;
}

/**
 * Fetch profile rows awaiting admin approval (newest first).
 * Used by the admin clients page to surface a banner + Approve/Reject
 * buttons for self-signed-up users.
 */
export async function getPendingSignups(): Promise<PendingSignup[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, phone, created_at')
      .eq('signup_status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return (data as ProfileRow[]).map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name ?? r.email,
      firstName: r.first_name,
      phone: r.phone,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}
