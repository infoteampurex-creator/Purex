'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import {
  createInvoice as dataCreateInvoice,
  sendInvoice as dataSendInvoice,
  markInvoicePaid as dataMarkInvoicePaid,
  voidInvoice as dataVoidInvoice,
  deleteDraftInvoice as dataDeleteDraft,
  updateCompanySettings as dataUpdateSettings,
  type CreateInvoiceInput,
  type CompanySettings,
} from '@/lib/data/invoices';

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  try {
    const sb = await createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in.' };
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = profile?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return { ok: false, error: 'Admin only.' };
    }
    return { ok: true, userId: user.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Auth check failed.',
    };
  }
}

export async function createInvoiceAction(input: CreateInvoiceInput) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const result = await dataCreateInvoice(input, auth.userId);
  if (result.ok) {
    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/clients/${input.clientId}`);
  }
  return result;
}

export async function sendInvoiceAction(invoiceId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  const result = await dataSendInvoice(invoiceId);
  if (result.ok) {
    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${invoiceId}`);
  }
  return result;
}

export async function markInvoicePaidAction(invoiceId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  const result = await dataMarkInvoicePaid(invoiceId);
  if (result.ok) {
    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${invoiceId}`);
  }
  return result;
}

export async function voidInvoiceAction(invoiceId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  const result = await dataVoidInvoice(invoiceId);
  if (result.ok) {
    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${invoiceId}`);
  }
  return result;
}

export async function deleteDraftInvoiceAction(invoiceId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  const result = await dataDeleteDraft(invoiceId);
  if (result.ok) revalidatePath('/admin/invoices');
  return result;
}

export async function updateCompanySettingsAction(
  patch: Partial<CompanySettings>
) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  const result = await dataUpdateSettings(patch);
  if (result.ok) revalidatePath('/admin/settings/company');
  return result;
}
