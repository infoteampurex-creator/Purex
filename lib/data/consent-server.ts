import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { CURRENT_CONSENT_VERSION } from '@/lib/data/consent-text';

// ════════════════════════════════════════════════════════════════════
// Server-only helpers for the consent system.
// Used by middleware (to gate /client/*) and by /client/profile (to
// show the user their current consent + withdrawal control).
// ════════════════════════════════════════════════════════════════════

export interface ConsentRecord {
  id: string;
  userId: string;
  consentVersion: string;
  signedAt: string;
  signedName: string;
  agreedToTerms: boolean;
  agreedToDataCollection: boolean;
  agreedToProgressPhotos: boolean;
  agreedToMarketingUse: boolean;
  agreedToWhatsapp: boolean;
  agreedToEmail: boolean;
  agreedToPhone: boolean;
  agreedToPush: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  withdrawnAt: string | null;
  withdrawnReason: string | null;
}

interface ConsentRow {
  id: string;
  user_id: string;
  consent_version: string;
  signed_at: string;
  signed_name: string;
  agreed_to_terms: boolean;
  agreed_to_data_collection: boolean;
  agreed_to_progress_photos: boolean;
  agreed_to_marketing_use: boolean;
  agreed_to_whatsapp: boolean;
  agreed_to_email: boolean;
  agreed_to_phone: boolean;
  agreed_to_push: boolean;
  ip_address: string | null;
  user_agent: string | null;
  withdrawn_at: string | null;
  withdrawn_reason: string | null;
}

function rowToRecord(r: ConsentRow): ConsentRecord {
  return {
    id: r.id,
    userId: r.user_id,
    consentVersion: r.consent_version,
    signedAt: r.signed_at,
    signedName: r.signed_name,
    agreedToTerms: r.agreed_to_terms,
    agreedToDataCollection: r.agreed_to_data_collection,
    agreedToProgressPhotos: r.agreed_to_progress_photos,
    agreedToMarketingUse: r.agreed_to_marketing_use,
    agreedToWhatsapp: r.agreed_to_whatsapp,
    agreedToEmail: r.agreed_to_email,
    agreedToPhone: r.agreed_to_phone,
    agreedToPush: r.agreed_to_push,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    withdrawnAt: r.withdrawn_at,
    withdrawnReason: r.withdrawn_reason,
  };
}

/** Latest non-withdrawn consent for this user at the current version. */
export async function getActiveConsent(
  userId: string
): Promise<ConsentRecord | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('client_consent_records')
      .select('*')
      .eq('user_id', userId)
      .eq('consent_version', CURRENT_CONSENT_VERSION)
      .is('withdrawn_at', null)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return rowToRecord(data as unknown as ConsentRow);
  } catch (err) {
    console.error('[consent] getActiveConsent failed', err);
    return null;
  }
}

/**
 * Lightweight check for the middleware. Avoids fetching the whole
 * record — just checks existence. Returns true when the user must
 * be redirected to /onboarding/consent.
 */
export async function needsConsent(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from('client_consent_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('consent_version', CURRENT_CONSENT_VERSION)
      .is('withdrawn_at', null);
    if (error) {
      console.error('[consent] needsConsent count failed', error);
      // Fail-open: if the count query errors (e.g. table missing in dev),
      // don't lock the user out. Logged for ops to investigate.
      return false;
    }
    return (count ?? 0) === 0;
  } catch (err) {
    console.error('[consent] needsConsent failed', err);
    return false;
  }
}

/** Full history for the user — newest first. Used on /client/profile. */
export async function getConsentHistory(
  userId: string
): Promise<ConsentRecord[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('client_consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('signed_at', { ascending: false });
    if (error || !data) return [];
    return (data as unknown as ConsentRow[]).map(rowToRecord);
  } catch (err) {
    console.error('[consent] getConsentHistory failed', err);
    return [];
  }
}
