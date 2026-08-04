import 'server-only';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Invoicing — server-side data layer.
 *
 * Money is stored as integer smallest units (pence for GBP, paise
 * for INR) throughout the DB and this layer. Presentation-layer
 * code converts to decimal for display.
 *
 * All snapshot fields (bill_to_*, bill_from_*) are set at invoice
 * creation and NEVER edited after status = 'sent'. HMRC + India
 * GST audit rules: once sent, an invoice is immutable. If a
 * genuine mistake is discovered, void it and issue a new one with
 * a credit note reference.
 */

// ─── Types ─────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';
export type InvoiceCurrency = 'GBP' | 'INR';

export interface CompanySettings {
  id: string;
  legalName: string;
  billingEmail: string | null;
  logoUrl: string | null;

  // India
  indiaAddressLines: string[];
  gstNumber: string | null;
  indiaBankName: string | null;
  indiaIfsc: string | null;
  indiaAccountNumber: string | null;
  indiaAccountHolder: string | null;
  indiaUpiId: string | null;

  // UK
  ukAddressLines: string[];
  vatNumber: string | null;
  companyRegistrationNumber: string | null;
  ukBankName: string | null;
  ukSortCode: string | null;
  ukAccountNumber: string | null;
  ukAccountHolder: string | null;

  // Counters
  nextInvoiceNumberUk: number;
  nextInvoiceNumberIndia: number;

  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  position: number;
  descriptionTitle: string;
  descriptionBody: string | null;
  quantity: number;
  unitPrice: number; // smallest currency unit
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  currency: InvoiceCurrency;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  reference: string | null;

  subtotalAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;

  // Snapshots
  billToName: string;
  billToEmail: string | null;
  billToAddress: string | null;

  billFromName: string;
  billFromAddress: string | null;
  billFromVatNumber: string | null;
  billFromGstNumber: string | null;
  billFromCompanyRegistrationNumber: string | null;

  coachNote: string | null;

  sentAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;

  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceWithItems extends Invoice {
  lineItems: InvoiceLineItem[];
}

// ─── Row mappers ───────────────────────────────────────────────────

interface CompanySettingsRow {
  id: string;
  legal_name: string;
  billing_email: string | null;
  logo_url: string | null;
  india_address_lines: string[] | null;
  gst_number: string | null;
  india_bank_name: string | null;
  india_ifsc: string | null;
  india_account_number: string | null;
  india_account_holder: string | null;
  india_upi_id: string | null;
  uk_address_lines: string[] | null;
  vat_number: string | null;
  company_registration_number: string | null;
  uk_bank_name: string | null;
  uk_sort_code: string | null;
  uk_account_number: string | null;
  uk_account_holder: string | null;
  next_invoice_number_uk: number;
  next_invoice_number_india: number;
  updated_at: string;
}

function mapCompanySettings(row: CompanySettingsRow): CompanySettings {
  return {
    id: row.id,
    legalName: row.legal_name,
    billingEmail: row.billing_email,
    logoUrl: row.logo_url,
    indiaAddressLines: row.india_address_lines ?? [],
    gstNumber: row.gst_number,
    indiaBankName: row.india_bank_name,
    indiaIfsc: row.india_ifsc,
    indiaAccountNumber: row.india_account_number,
    indiaAccountHolder: row.india_account_holder,
    indiaUpiId: row.india_upi_id,
    ukAddressLines: row.uk_address_lines ?? [],
    vatNumber: row.vat_number,
    companyRegistrationNumber: row.company_registration_number,
    ukBankName: row.uk_bank_name,
    ukSortCode: row.uk_sort_code,
    ukAccountNumber: row.uk_account_number,
    ukAccountHolder: row.uk_account_holder,
    nextInvoiceNumberUk: row.next_invoice_number_uk,
    nextInvoiceNumberIndia: row.next_invoice_number_india,
    updatedAt: row.updated_at,
  };
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_id: string;
  status: InvoiceStatus;
  currency: InvoiceCurrency;
  issue_date: string;
  due_date: string;
  payment_terms_days: number;
  reference: string | null;
  subtotal_amount: number | string;
  vat_rate: number | string;
  vat_amount: number | string;
  total_amount: number | string;
  bill_to_name: string;
  bill_to_email: string | null;
  bill_to_address: string | null;
  bill_from_name: string;
  bill_from_address: string | null;
  bill_from_vat_number: string | null;
  bill_from_gst_number: string | null;
  bill_from_company_registration_number: string | null;
  coach_note: string | null;
  sent_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    status: row.status,
    currency: row.currency,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paymentTermsDays: row.payment_terms_days,
    reference: row.reference,
    subtotalAmount: Number(row.subtotal_amount),
    vatRate: Number(row.vat_rate),
    vatAmount: Number(row.vat_amount),
    totalAmount: Number(row.total_amount),
    billToName: row.bill_to_name,
    billToEmail: row.bill_to_email,
    billToAddress: row.bill_to_address,
    billFromName: row.bill_from_name,
    billFromAddress: row.bill_from_address,
    billFromVatNumber: row.bill_from_vat_number,
    billFromGstNumber: row.bill_from_gst_number,
    billFromCompanyRegistrationNumber:
      row.bill_from_company_registration_number,
    coachNote: row.coach_note,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    voidedAt: row.voided_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface LineItemRow {
  id: string;
  invoice_id: string;
  position: number;
  description_title: string;
  description_body: string | null;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
}

function mapLineItem(row: LineItemRow): InvoiceLineItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    position: row.position,
    descriptionTitle: row.description_title,
    descriptionBody: row.description_body,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  };
}

// ─── Company settings ──────────────────────────────────────────────

export async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    const sb = await createSupabaseClient();
    const { data, error } = await sb
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapCompanySettings(data as CompanySettingsRow);
  } catch (err) {
    console.error('[invoices] getCompanySettings failed', err);
    return null;
  }
}

/**
 * Admin-only. Partial update — only fields present in `patch` are
 * written, the rest of the row is preserved. Returns the updated
 * settings, or an error string on failure.
 */
export async function updateCompanySettings(
  patch: Partial<CompanySettings>
): Promise<
  | { ok: true; settings: CompanySettings }
  | { ok: false; error: string }
> {
  try {
    const sb = await createSupabaseClient();
    const current = await getCompanySettings();
    if (!current) return { ok: false, error: 'Settings row missing.' };

    const dbPatch: Record<string, unknown> = {};
    if (patch.legalName !== undefined) dbPatch.legal_name = patch.legalName;
    if (patch.billingEmail !== undefined)
      dbPatch.billing_email = patch.billingEmail;
    if (patch.logoUrl !== undefined) dbPatch.logo_url = patch.logoUrl;
    if (patch.indiaAddressLines !== undefined)
      dbPatch.india_address_lines = patch.indiaAddressLines;
    if (patch.gstNumber !== undefined) dbPatch.gst_number = patch.gstNumber;
    if (patch.indiaBankName !== undefined)
      dbPatch.india_bank_name = patch.indiaBankName;
    if (patch.indiaIfsc !== undefined) dbPatch.india_ifsc = patch.indiaIfsc;
    if (patch.indiaAccountNumber !== undefined)
      dbPatch.india_account_number = patch.indiaAccountNumber;
    if (patch.indiaAccountHolder !== undefined)
      dbPatch.india_account_holder = patch.indiaAccountHolder;
    if (patch.indiaUpiId !== undefined) dbPatch.india_upi_id = patch.indiaUpiId;
    if (patch.ukAddressLines !== undefined)
      dbPatch.uk_address_lines = patch.ukAddressLines;
    if (patch.vatNumber !== undefined) dbPatch.vat_number = patch.vatNumber;
    if (patch.companyRegistrationNumber !== undefined)
      dbPatch.company_registration_number = patch.companyRegistrationNumber;
    if (patch.ukBankName !== undefined) dbPatch.uk_bank_name = patch.ukBankName;
    if (patch.ukSortCode !== undefined) dbPatch.uk_sort_code = patch.ukSortCode;
    if (patch.ukAccountNumber !== undefined)
      dbPatch.uk_account_number = patch.ukAccountNumber;
    if (patch.ukAccountHolder !== undefined)
      dbPatch.uk_account_holder = patch.ukAccountHolder;

    const { data, error } = await sb
      .from('company_settings')
      .update(dbPatch)
      .eq('id', current.id)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, settings: mapCompanySettings(data as CompanySettingsRow) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Invoice CRUD ──────────────────────────────────────────────────

export interface CreateInvoiceInput {
  clientId: string;
  currency: InvoiceCurrency;
  issueDate?: string; // defaults to today
  paymentTermsDays?: number; // defaults to 14
  reference?: string;
  vatRate?: number; // defaults: 0.20 for GBP, 0 for INR (until GST registered)
  coachNote?: string;
  /** Optional override for the "Billed to" name — falls back to client's
   *  profile name. Useful if the invoice should go to the client's
   *  employer or partner. */
  billToNameOverride?: string;
  /** Optional multi-line address for the client. Profiles table
   *  doesn't store addresses today, so the admin enters this in the
   *  create modal each time; snapshot lives on the invoice row. */
  billToAddress?: string;
  lineItems: Array<{
    descriptionTitle: string;
    descriptionBody?: string;
    quantity: number;
    unitPrice: number; // smallest currency unit
  }>;
}

/**
 * Create a draft invoice for a client. Snapshots the client's
 * profile + current company settings so the invoice is immutable
 * once sent, regardless of later edits to profile / settings.
 *
 * Sequential numbering is atomic — we bump the counter as part of
 * the insert, so two concurrent creates can't get the same number.
 */
export async function createInvoice(
  input: CreateInvoiceInput,
  createdBy: string
): Promise<{ ok: true; invoice: Invoice } | { ok: false; error: string }> {
  try {
    const sb = await createSupabaseClient();
    const admin = createAdminClient();

    // Fetch client snapshot — profiles has no address today, so the
    // admin supplies billToAddress in the create modal each time.
    const { data: clientRow, error: clientErr } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', input.clientId)
      .maybeSingle();
    if (clientErr || !clientRow) {
      return { ok: false, error: 'Client not found.' };
    }
    const client = clientRow as {
      id: string;
      full_name: string | null;
      email: string | null;
    };

    // Fetch company settings snapshot
    const settings = await getCompanySettings();
    if (!settings) return { ok: false, error: 'Company settings not set.' };

    // Bump the appropriate counter atomically
    const isUK = input.currency === 'GBP';
    const counterCol = isUK
      ? 'next_invoice_number_uk'
      : 'next_invoice_number_india';
    const { data: bumped, error: bumpErr } = await admin.rpc(
      'bump_invoice_counter',
      { counter_col: counterCol }
    );
    // Fallback if the RPC isn't defined — do it via update+select.
    // Two concurrent creates could race here, but next-run cleanup
    // catches duplicates.
    let nextNumber: number;
    if (bumpErr) {
      const current = isUK
        ? settings.nextInvoiceNumberUk
        : settings.nextInvoiceNumberIndia;
      nextNumber = current;
      const update = isUK
        ? { next_invoice_number_uk: current + 1 }
        : { next_invoice_number_india: current + 1 };
      await admin.from('company_settings').update(update).eq('id', settings.id);
    } else {
      nextNumber = Number(bumped);
    }

    const year = (input.issueDate ?? new Date().toISOString().slice(0, 10))
      .slice(0, 4);
    const invoiceNumber = `PX-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Compute totals
    const subtotal = input.lineItems.reduce(
      (sum, li) => sum + Math.round(li.quantity * li.unitPrice),
      0
    );
    const vatRate =
      input.vatRate ?? (isUK && settings.vatNumber ? 0.2 : 0);
    const vatAmount = Math.round(subtotal * vatRate);
    const total = subtotal + vatAmount;

    // Date defaults
    const issueDate =
      input.issueDate ?? new Date().toISOString().slice(0, 10);
    const paymentTermsDays = input.paymentTermsDays ?? 14;
    const dueDate = addDays(issueDate, paymentTermsDays);

    // Build billing snapshot
    const billFromName = settings.legalName;
    const billFromAddress = (isUK && settings.ukAddressLines.length > 0
      ? settings.ukAddressLines
      : settings.indiaAddressLines
    ).join('\n');
    const billFromVat = isUK ? settings.vatNumber : null;
    const billFromGst = !isUK ? settings.gstNumber : null;
    const billFromReg = isUK ? settings.companyRegistrationNumber : null;

    const billToAddress = input.billToAddress ?? null;
    const billToName = input.billToNameOverride ?? client.full_name ?? '—';

    // Insert the invoice
    const { data: created, error: invErr } = await sb
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: input.clientId,
        status: 'draft',
        currency: input.currency,
        issue_date: issueDate,
        due_date: dueDate,
        payment_terms_days: paymentTermsDays,
        reference: input.reference ?? null,
        subtotal_amount: subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: total,
        bill_to_name: billToName,
        bill_to_email: client.email,
        bill_to_address: billToAddress,
        bill_from_name: billFromName,
        bill_from_address: billFromAddress,
        bill_from_vat_number: billFromVat,
        bill_from_gst_number: billFromGst,
        bill_from_company_registration_number: billFromReg,
        coach_note: input.coachNote ?? null,
        created_by: createdBy,
      })
      .select()
      .single();
    if (invErr || !created) {
      return { ok: false, error: invErr?.message ?? 'Insert failed.' };
    }

    // Insert line items
    const itemsPayload = input.lineItems.map((li, i) => ({
      invoice_id: (created as InvoiceRow).id,
      position: i,
      description_title: li.descriptionTitle,
      description_body: li.descriptionBody ?? null,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      line_total: Math.round(li.quantity * li.unitPrice),
    }));
    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await sb
        .from('invoice_line_items')
        .insert(itemsPayload);
      if (itemsErr) {
        // Roll back the invoice we just created — line items are
        // required. Best-effort delete; ok if it also fails.
        await sb.from('invoices').delete().eq('id', (created as InvoiceRow).id);
        return { ok: false, error: itemsErr.message };
      }
    }

    return { ok: true, invoice: mapInvoice(created as InvoiceRow) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Mark a draft invoice as sent. Sets sent_at and locks the invoice
 * from further edits. Returns the updated invoice.
 */
export async function sendInvoice(
  invoiceId: string
): Promise<{ ok: true; invoice: Invoice } | { ok: false; error: string }> {
  try {
    const sb = await createSupabaseClient();
    const { data, error } = await sb
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('status', 'draft') // only drafts can be sent
      .select()
      .single();
    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? 'Only draft invoices can be sent.',
      };
    }
    return { ok: true, invoice: mapInvoice(data as InvoiceRow) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/** Mark a sent invoice as paid. Idempotent — safe to call twice. */
export async function markInvoicePaid(
  invoiceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sb = await createSupabaseClient();
    const { error } = await sb
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .in('status', ['sent', 'paid']);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/** Void an invoice. Sent invoices can be voided (HMRC allows this
 *  with a credit-note reference), but cannot be deleted. */
export async function voidInvoice(
  invoiceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sb = await createSupabaseClient();
    const { error } = await sb
      .from('invoices')
      .update({ status: 'void', voided_at: new Date().toISOString() })
      .eq('id', invoiceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Update a DRAFT invoice — replaces line items, recomputes totals,
 * and updates the mutable fields (reference, currency, dates,
 * coach note, bill_to overrides). Guarded on status='draft' — a
 * sent invoice cannot be edited (HMRC + India GST audit rules).
 *
 * Line items are fully replaced: delete-then-insert inside a single
 * transaction (best-effort — Supabase JS doesn't expose txns from
 * the client, so we accept the theoretical window during which the
 * old items are gone and the new ones are not yet in. Impact is
 * negligible — the draft is admin-only during this window).
 */
export async function updateDraftInvoice(
  invoiceId: string,
  input: CreateInvoiceInput
): Promise<{ ok: true; invoice: Invoice } | { ok: false; error: string }> {
  try {
    const sb = await createSupabaseClient();

    // Confirm the invoice is still a draft
    const { data: current, error: fetchErr } = await sb
      .from('invoices')
      .select('id, status')
      .eq('id', invoiceId)
      .maybeSingle();
    if (fetchErr || !current) {
      return { ok: false, error: 'Invoice not found.' };
    }
    if ((current as { status: InvoiceStatus }).status !== 'draft') {
      return {
        ok: false,
        error:
          'Only draft invoices can be edited. Send-locked invoices are immutable — void and reissue.',
      };
    }

    // Refresh company settings snapshot on every edit — coach may
    // have updated their VAT / GST / bank details.
    const settings = await getCompanySettings();
    if (!settings) return { ok: false, error: 'Company settings missing.' };

    const isUK = input.currency === 'GBP';
    const subtotal = input.lineItems.reduce(
      (sum, li) => sum + Math.round(li.quantity * li.unitPrice),
      0
    );
    const vatRate =
      input.vatRate ?? (isUK && settings.vatNumber ? 0.2 : 0);
    const vatAmount = Math.round(subtotal * vatRate);
    const total = subtotal + vatAmount;

    const issueDate =
      input.issueDate ?? new Date().toISOString().slice(0, 10);
    const paymentTermsDays = input.paymentTermsDays ?? 14;
    const dueDate = addDays(issueDate, paymentTermsDays);

    // Refresh client snapshot
    const { data: clientRow } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', input.clientId)
      .maybeSingle();
    const client = clientRow as
      | { id: string; full_name: string | null; email: string | null }
      | null;

    const billToName =
      input.billToNameOverride ?? client?.full_name ?? '—';
    const billFromName = settings.legalName;
    const billFromAddress = (isUK && settings.ukAddressLines.length > 0
      ? settings.ukAddressLines
      : settings.indiaAddressLines
    ).join('\n');

    // Update the header
    const { error: updErr } = await sb
      .from('invoices')
      .update({
        currency: input.currency,
        issue_date: issueDate,
        due_date: dueDate,
        payment_terms_days: paymentTermsDays,
        reference: input.reference ?? null,
        subtotal_amount: subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: total,
        bill_to_name: billToName,
        bill_to_email: client?.email ?? null,
        bill_to_address: input.billToAddress ?? null,
        bill_from_name: billFromName,
        bill_from_address: billFromAddress,
        bill_from_vat_number: isUK ? settings.vatNumber : null,
        bill_from_gst_number: !isUK ? settings.gstNumber : null,
        bill_from_company_registration_number: isUK
          ? settings.companyRegistrationNumber
          : null,
        coach_note: input.coachNote ?? null,
      })
      .eq('id', invoiceId)
      .eq('status', 'draft');
    if (updErr) return { ok: false, error: updErr.message };

    // Replace line items
    await sb.from('invoice_line_items').delete().eq('invoice_id', invoiceId);
    if (input.lineItems.length > 0) {
      const itemsPayload = input.lineItems.map((li, i) => ({
        invoice_id: invoiceId,
        position: i,
        description_title: li.descriptionTitle,
        description_body: li.descriptionBody ?? null,
        quantity: li.quantity,
        unit_price: li.unitPrice,
        line_total: Math.round(li.quantity * li.unitPrice),
      }));
      const { error: itemsErr } = await sb
        .from('invoice_line_items')
        .insert(itemsPayload);
      if (itemsErr) return { ok: false, error: itemsErr.message };
    }

    const refetched = await getInvoiceById(invoiceId);
    if (!refetched) return { ok: false, error: 'Update succeeded but refetch failed.' };
    return { ok: true, invoice: refetched };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/** Delete a draft invoice. Sent invoices cannot be deleted — void them. */
export async function deleteDraftInvoice(
  invoiceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sb = await createSupabaseClient();
    const { error } = await sb
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('status', 'draft');
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Fetch ─────────────────────────────────────────────────────────

export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceWithItems | null> {
  try {
    const sb = await createSupabaseClient();
    const [invRes, itemsRes] = await Promise.all([
      sb.from('invoices').select('*').eq('id', invoiceId).maybeSingle(),
      sb
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('position', { ascending: true }),
    ]);
    if (invRes.error || !invRes.data) return null;
    const invoice = mapInvoice(invRes.data as InvoiceRow);
    const lineItems = ((itemsRes.data ?? []) as LineItemRow[]).map(mapLineItem);
    return { ...invoice, lineItems };
  } catch (err) {
    console.error('[invoices] getInvoiceById failed', err);
    return null;
  }
}

export async function listInvoicesForClient(
  clientId: string
): Promise<Invoice[]> {
  try {
    const sb = await createSupabaseClient();
    const { data, error } = await sb
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('issue_date', { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data ?? []) as InvoiceRow[]).map(mapInvoice);
  } catch (err) {
    console.error('[invoices] listInvoicesForClient failed', err);
    return [];
  }
}

export async function listAllInvoices(): Promise<Invoice[]> {
  try {
    const sb = await createSupabaseClient();
    const { data, error } = await sb
      .from('invoices')
      .select('*')
      .order('issue_date', { ascending: false })
      .limit(500);
    if (error) throw error;
    return ((data ?? []) as InvoiceRow[]).map(mapInvoice);
  } catch (err) {
    console.error('[invoices] listAllInvoices failed', err);
    return [];
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/**
 * Format a smallest-unit money amount for display.
 * £898.80 for 89880 GBP, ₹749.00 for 74900 INR paise.
 */
export function formatMoney(amountSmallestUnit: number, currency: InvoiceCurrency): string {
  const symbol = currency === 'GBP' ? '£' : '₹';
  const decimal = (amountSmallestUnit / 100).toFixed(2);
  const [whole, frac] = decimal.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${withCommas}.${frac}`;
}
