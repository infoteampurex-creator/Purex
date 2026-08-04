'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, AlertCircle, Sparkles, Send, Save } from 'lucide-react';
import {
  createInvoiceAction,
  updateDraftInvoiceAction,
  createAndSendInvoiceAction,
  sendInvoiceAction,
} from '@/lib/actions/invoices';
import type {
  CompanySettings,
  InvoiceCurrency,
  InvoiceWithItems,
} from '@/lib/data/invoices';
import {
  INVOICE_SERVICES,
  SERVICE_GROUPS,
} from '@/lib/data/invoice-services';

interface Props {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  settings: CompanySettings | null;
  /** 'create' (default) or 'edit' for a draft update. */
  mode?: 'create' | 'edit';
  /** Required in edit mode — the invoice ID to update. */
  invoiceId?: string;
  /** Existing invoice values to seed the form in edit mode. */
  initial?: InvoiceWithItems | null;
}

interface DraftLineItem {
  key: string;
  descriptionTitle: string;
  descriptionBody: string;
  quantity: string;
  unitPriceDecimal: string;
}

const emptyLine = (): DraftLineItem => ({
  key: Math.random().toString(36).slice(2),
  descriptionTitle: '',
  descriptionBody: '',
  quantity: '1',
  unitPriceDecimal: '',
});

/**
 * Full-page form for creating a new invoice. Line-item builder,
 * currency toggle, VAT rate (auto-populated from company settings
 * when applicable), coach note, and optional "Bill to" address
 * override.
 *
 * Currency drives which VAT/GST behaviour applies + which bank
 * details show on the resulting invoice. Admin can toggle before
 * submitting.
 */
export function CreateInvoiceForm({
  clientId,
  clientName,
  clientEmail,
  settings,
  mode = 'create',
  invoiceId,
  initial,
}: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [currency, setCurrency] = useState<InvoiceCurrency>(
    initial?.currency ?? 'INR'
  );
  const [billToAddress, setBillToAddress] = useState(
    initial?.billToAddress ?? ''
  );
  const [billToNameOverride, setBillToNameOverride] = useState(
    initial && initial.billToName !== clientName ? initial.billToName : ''
  );
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [paymentTermsDays, setPaymentTermsDays] = useState(
    String(initial?.paymentTermsDays ?? 14)
  );
  const [coachNote, setCoachNote] = useState(initial?.coachNote ?? '');
  const [lineItems, setLineItems] = useState<DraftLineItem[]>(
    initial && initial.lineItems.length > 0
      ? initial.lineItems.map((li) => ({
          key: li.id,
          descriptionTitle: li.descriptionTitle,
          descriptionBody: li.descriptionBody ?? '',
          quantity: String(li.quantity),
          unitPriceDecimal: (li.unitPrice / 100).toFixed(2),
        }))
      : [emptyLine()]
  );
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState<'draft' | 'send' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isUK = currency === 'GBP';
  const symbol = isUK ? '£' : '₹';
  const vatRate = isUK && settings?.vatNumber ? 0.2 : !isUK && settings?.gstNumber ? 0.18 : 0;

  // Live totals
  const subtotal = lineItems.reduce((sum, li) => {
    const q = Number(li.quantity || 0);
    const p = Number(li.unitPriceDecimal || 0);
    return sum + Math.round(q * p * 100);
  }, 0);
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  const addLine = () => setLineItems((ls) => [...ls, emptyLine()]);
  const removeLine = (key: string) =>
    setLineItems((ls) => (ls.length === 1 ? ls : ls.filter((l) => l.key !== key)));
  const updateLine = (key: string, patch: Partial<DraftLineItem>) =>
    setLineItems((ls) =>
      ls.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );

  /** Fill a line from the service catalog. Fills every empty slot
   *  first — if the first line is empty, use it; else append. */
  const addFromCatalog = (serviceKey: string) => {
    const svc = INVOICE_SERVICES.find((s) => s.key === serviceKey);
    if (!svc) return;
    const priceDecimal = (
      (isUK ? svc.gbpPrice : svc.inrPrice) / 100
    ).toFixed(2);

    setLineItems((ls) => {
      // Reuse the first empty line if there is one
      const emptyIdx = ls.findIndex(
        (l) =>
          !l.descriptionTitle.trim() &&
          !l.descriptionBody.trim() &&
          !l.unitPriceDecimal
      );
      const filled: DraftLineItem = {
        key: emptyIdx >= 0 ? ls[emptyIdx].key : Math.random().toString(36).slice(2),
        descriptionTitle: svc.title,
        descriptionBody: svc.description,
        quantity: '1',
        unitPriceDecimal: priceDecimal,
      };
      if (emptyIdx >= 0) {
        return ls.map((l, i) => (i === emptyIdx ? filled : l));
      }
      return [...ls, filled];
    });
  };

  const submit = async (e: FormEvent, thenSend: boolean) => {
    e.preventDefault();
    setErr(null);
    const cleaned = lineItems
      .filter((li) => li.descriptionTitle.trim())
      .map((li) => ({
        descriptionTitle: li.descriptionTitle.trim(),
        descriptionBody: li.descriptionBody.trim() || undefined,
        quantity: Number(li.quantity) || 1,
        unitPrice: Math.round(Number(li.unitPriceDecimal) * 100), // decimal → smallest
      }));
    if (cleaned.length === 0) {
      setErr('Add at least one line item with a title.');
      return;
    }

    setSaving(true);
    setSavingMode(thenSend ? 'send' : 'draft');
    const payload = {
      clientId,
      currency,
      reference: reference || undefined,
      paymentTermsDays: Number(paymentTermsDays) || 14,
      coachNote: coachNote || undefined,
      billToNameOverride: billToNameOverride || undefined,
      billToAddress: billToAddress || undefined,
      vatRate,
      lineItems: cleaned,
    };

    let targetId: string | null = null;
    if (isEdit && invoiceId) {
      const result = await updateDraftInvoiceAction(invoiceId, payload);
      if (!result.ok) {
        setErr(result.error);
        setSaving(false);
        setSavingMode(null);
        return;
      }
      targetId = invoiceId;
      // If they asked to send after updating, fire the send too
      if (thenSend) {
        const sendRes = await sendInvoiceAction(invoiceId);
        if (!sendRes.ok) {
          setErr(sendRes.error);
          setSaving(false);
          setSavingMode(null);
          return;
        }
      }
    } else if (thenSend) {
      const result = await createAndSendInvoiceAction(payload);
      if (!result.ok) {
        setErr(result.error);
        setSaving(false);
        setSavingMode(null);
        return;
      }
      targetId = result.invoice.id;
    } else {
      const result = await createInvoiceAction(payload);
      if (!result.ok) {
        setErr(result.error);
        setSaving(false);
        setSavingMode(null);
        return;
      }
      targetId = result.invoice.id;
    }

    setSaving(false);
    setSavingMode(null);
    router.push(`/admin/invoices/${targetId}`);
  };

  return (
    <form onSubmit={(e) => submit(e, true)} className="space-y-6">
      {/* Currency + basics */}
      <Section title="Invoice basics">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as InvoiceCurrency)}
              className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm"
            >
              <option value="INR">₹ INR — India</option>
              <option value="GBP">£ GBP — United Kingdom</option>
            </select>
          </Field>
          <Field label={isUK ? 'VAT rate' : 'GST rate'}>
            <input
              type="text"
              value={
                vatRate === 0
                  ? `Not applied (no ${isUK ? 'VAT' : 'GST'} number)`
                  : `${Math.round(vatRate * 100)}%`
              }
              readOnly
              className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border text-sm text-text-muted"
            />
          </Field>
          <Field label="Payment terms (days)">
            <input
              type="number"
              min="0"
              max="365"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm"
            />
          </Field>
          <Field label="Reference (optional)" span="full">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Sept plan · Blood panel"
              className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm"
            />
          </Field>
        </div>
      </Section>

      {/* Billed to */}
      <Section title="Billed to">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Client name (auto-filled)">
            <input
              type="text"
              value={billToNameOverride || clientName}
              onChange={(e) => setBillToNameOverride(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm"
            />
            <div
              className="mt-1 text-text-muted"
              style={{ fontSize: 10.5 }}
            >
              Override if invoice should go to employer / partner
            </div>
          </Field>
          <Field label="Email (from profile)">
            <input
              type="email"
              value={clientEmail ?? ''}
              readOnly
              className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border text-sm text-text-muted"
            />
          </Field>
          <Field label="Billing address (optional)" span="full">
            <textarea
              value={billToAddress}
              onChange={(e) => setBillToAddress(e.target.value)}
              placeholder={
                isUK
                  ? '42 Marylebone High Street\nLondon W1U 4NL\nUnited Kingdom'
                  : 'Optional — one line per row'
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm resize-none"
            />
          </Field>
        </div>
      </Section>

      {/* Line items */}
      <Section
        title="Line items"
        rightSlot={
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border text-xs hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={11} />
            Add line
          </button>
        }
      >
        {/* Service catalog picker — pre-fills a line from a
            preset service (plan / diagnostic / consultation). */}
        <div className="mb-4">
          <div
            className="font-mono uppercase tracking-[0.16em] font-bold text-[10px] text-text-muted mb-2 inline-flex items-center gap-1.5"
          >
            <Sparkles size={11} className="text-[#d4a050]" />
            Add from Team Purex services
          </div>
          <div className="flex flex-col gap-2">
            {SERVICE_GROUPS.map((group) => {
              const options = INVOICE_SERVICES.filter(
                (s) => s.group === group.key
              );
              if (options.length === 0) return null;
              return (
                <div
                  key={group.key}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <span
                    className="font-mono uppercase tracking-[0.14em] font-bold text-text-muted"
                    style={{ fontSize: 9, minWidth: 90 }}
                  >
                    {group.label}
                  </span>
                  {options.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => addFromCatalog(opt.key)}
                      className="rounded-full px-2.5 py-1 border border-border text-[11px] hover:border-[#d4a050] hover:text-[#d4a050] transition-colors"
                    >
                      + {opt.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {lineItems.map((li) => {
            const q = Number(li.quantity || 0);
            const p = Number(li.unitPriceDecimal || 0);
            const lineTotal = q * p;
            return (
              <div
                key={li.key}
                className="rounded-xl border border-border bg-bg-elevated p-4 relative"
              >
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(li.key)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                    aria-label="Remove line"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <div className="grid md:grid-cols-[1fr_100px_140px] gap-3">
                  <div>
                    <input
                      type="text"
                      value={li.descriptionTitle}
                      onChange={(e) =>
                        updateLine(li.key, { descriptionTitle: e.target.value })
                      }
                      placeholder="Service title (e.g. Integrated coaching · September)"
                      className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm mb-2"
                    />
                    <textarea
                      value={li.descriptionBody}
                      onChange={(e) =>
                        updateLine(li.key, { descriptionBody: e.target.value })
                      }
                      placeholder="Optional detail — what's included, dates, session count"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label
                      className="block font-mono uppercase tracking-[0.14em] font-bold text-[9px] text-text-muted mb-1"
                    >
                      Qty
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={li.quantity}
                      onChange={(e) =>
                        updateLine(li.key, { quantity: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      className="block font-mono uppercase tracking-[0.14em] font-bold text-[9px] text-text-muted mb-1"
                    >
                      Unit price ({symbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={li.unitPriceDecimal}
                      onChange={(e) =>
                        updateLine(li.key, { unitPriceDecimal: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm tabular-nums"
                    />
                    <div
                      className="mt-1 text-right font-mono text-text-muted tabular-nums"
                      style={{ fontSize: 10.5 }}
                    >
                      = {symbol}
                      {lineTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Coach note */}
      <Section title="Personal note (optional)">
        <textarea
          value={coachNote}
          onChange={(e) => setCoachNote(e.target.value)}
          rows={3}
          placeholder="A sentence to your client — turns a receipt into a check-in."
          className="w-full px-3 py-2 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm resize-none"
        />
      </Section>

      {/* Totals preview + save bar */}
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <div className="grid md:grid-cols-2 gap-6 items-end">
          <div>
            <div
              className="font-mono uppercase tracking-[0.20em] font-bold mb-2"
              style={{ fontSize: 10, color: '#d4a050' }}
            >
              Preview totals
            </div>
            <div className="flex flex-col gap-1 tabular-nums">
              <PreviewRow label="Subtotal" value={fmt(subtotal, symbol)} />
              {vatRate > 0 && (
                <PreviewRow
                  label={`${isUK ? 'VAT' : 'GST'} · ${Math.round(vatRate * 100)}%`}
                  value={fmt(vatAmount, symbol)}
                />
              )}
              <PreviewRow
                label="Total"
                value={fmt(total, symbol)}
                bold
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 flex-wrap">
            {err && (
              <div
                className="inline-flex items-center gap-1.5 text-[#ff6b6b] font-mono uppercase tracking-[0.14em] font-bold w-full text-right"
                style={{ fontSize: 10 }}
              >
                <AlertCircle size={12} />
                {err}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => submit(e as unknown as FormEvent, false)}
              disabled={saving}
              className="h-11 px-6 rounded-xl font-mono uppercase tracking-[0.18em] font-bold flex items-center gap-2 border border-border text-text-muted hover:border-accent hover:text-accent transition-colors"
              style={{ fontSize: 11 }}
            >
              {saving && savingMode === 'draft' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {isEdit ? 'Save changes' : 'Save as draft'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-6 rounded-xl font-mono uppercase tracking-[0.18em] font-bold flex items-center gap-2"
              style={{
                fontSize: 11,
                color: '#0a0c09',
                background:
                  'linear-gradient(135deg, #d4ff5a 0%, #a8e60a 100%)',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving && savingMode === 'send' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              {isEdit ? 'Save & send now' : 'Save & send now'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function fmt(smallestUnit: number, symbol: string): string {
  const decimal = (smallestUnit / 100).toFixed(2);
  const [w, f] = decimal.split('.');
  return `${symbol}${w.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${f}`;
}

function Section({
  title,
  rightSlot,
  children,
}: {
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-base tracking-tight">
          {title}
        </h2>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: 'full';
  children: React.ReactNode;
}) {
  return (
    <div className={span === 'full' ? 'md:col-span-3' : undefined}>
      <label className="block font-mono uppercase tracking-[0.16em] font-bold text-[10px] text-text-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function PreviewRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className="font-mono uppercase tracking-[0.16em] font-bold text-text-muted"
        style={{ fontSize: 10 }}
      >
        {label}
      </span>
      <span
        className={bold ? 'text-lg font-semibold' : 'text-sm text-text-muted'}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  );
}
