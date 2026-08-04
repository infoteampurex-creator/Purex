'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { updateCompanySettingsAction } from '@/lib/actions/invoices';
import type { CompanySettings } from '@/lib/data/invoices';

interface Props {
  initial: CompanySettings | null;
}

/**
 * Editable form for the singleton company_settings row. All fields
 * are optional except legal_name — admin can save partial state
 * and fill in the rest (VAT no, GST no, bank details) later as
 * they get registered.
 */
export function CompanySettingsForm({ initial }: Props) {
  const [state, setState] = useState<Partial<CompanySettings>>({
    legalName: initial?.legalName ?? 'Team Purex',
    billingEmail: initial?.billingEmail ?? '',
    indiaAddressLines: initial?.indiaAddressLines ?? [],
    gstNumber: initial?.gstNumber ?? '',
    indiaBankName: initial?.indiaBankName ?? '',
    indiaIfsc: initial?.indiaIfsc ?? '',
    indiaAccountNumber: initial?.indiaAccountNumber ?? '',
    indiaAccountHolder: initial?.indiaAccountHolder ?? '',
    indiaUpiId: initial?.indiaUpiId ?? '',
    ukAddressLines: initial?.ukAddressLines ?? [],
    vatNumber: initial?.vatNumber ?? '',
    companyRegistrationNumber: initial?.companyRegistrationNumber ?? '',
    ukBankName: initial?.ukBankName ?? '',
    ukSortCode: initial?.ukSortCode ?? '',
    ukAccountNumber: initial?.ukAccountNumber ?? '',
    ukAccountHolder: initial?.ukAccountHolder ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const cleanPatch: Partial<CompanySettings> = {
      ...state,
      billingEmail: state.billingEmail || null,
      gstNumber: state.gstNumber || null,
      indiaBankName: state.indiaBankName || null,
      indiaIfsc: state.indiaIfsc || null,
      indiaAccountNumber: state.indiaAccountNumber || null,
      indiaAccountHolder: state.indiaAccountHolder || null,
      indiaUpiId: state.indiaUpiId || null,
      vatNumber: state.vatNumber || null,
      companyRegistrationNumber: state.companyRegistrationNumber || null,
      ukBankName: state.ukBankName || null,
      ukSortCode: state.ukSortCode || null,
      ukAccountNumber: state.ukAccountNumber || null,
      ukAccountHolder: state.ukAccountHolder || null,
    };
    const res = await updateCompanySettingsAction(cleanPatch);
    setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
    setSaving(false);
  };

  const setField = <K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K] | string | null
  ) => setState((s) => ({ ...s, [key]: value }));

  const setAddress = (
    key: 'indiaAddressLines' | 'ukAddressLines',
    text: string
  ) => setState((s) => ({ ...s, [key]: text.split('\n') }));

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Legal + contact */}
      <Section title="Legal identity" subtitle="Shown on every invoice">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Legal name" required>
            <TextInput
              value={state.legalName ?? ''}
              onChange={(v) => setField('legalName', v)}
            />
          </Field>
          <Field label="Billing email">
            <TextInput
              type="email"
              value={state.billingEmail ?? ''}
              onChange={(v) => setField('billingEmail', v)}
              placeholder="billing@teampurex.com"
            />
          </Field>
        </div>
      </Section>

      {/* INDIA */}
      <Section
        title="India"
        subtitle="Used when the invoice currency is INR"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Address (one line per row)" span="full">
            <TextArea
              value={(state.indiaAddressLines ?? []).join('\n')}
              onChange={(v) => setAddress('indiaAddressLines', v)}
              rows={4}
              placeholder={
                'Plot 6, Jubilee Hills Rd No. 36\nHyderabad, Telangana 500033\nIndia'
              }
            />
          </Field>
          <Field label="GSTIN (optional)">
            <TextInput
              value={state.gstNumber ?? ''}
              onChange={(v) => setField('gstNumber', v)}
              placeholder="Leave blank until registered"
            />
          </Field>
          <div />
          <Field label="Bank name">
            <TextInput
              value={state.indiaBankName ?? ''}
              onChange={(v) => setField('indiaBankName', v)}
            />
          </Field>
          <Field label="Account holder">
            <TextInput
              value={state.indiaAccountHolder ?? ''}
              onChange={(v) => setField('indiaAccountHolder', v)}
            />
          </Field>
          <Field label="IFSC">
            <TextInput
              value={state.indiaIfsc ?? ''}
              onChange={(v) => setField('indiaIfsc', v)}
              placeholder="HDFC0001234"
            />
          </Field>
          <Field label="Account number">
            <TextInput
              value={state.indiaAccountNumber ?? ''}
              onChange={(v) => setField('indiaAccountNumber', v)}
            />
          </Field>
          <Field label="UPI ID (optional)" span="full">
            <TextInput
              value={state.indiaUpiId ?? ''}
              onChange={(v) => setField('indiaUpiId', v)}
              placeholder="teampurex@ybl"
            />
          </Field>
        </div>
      </Section>

      {/* UK */}
      <Section
        title="United Kingdom"
        subtitle="Used when the invoice currency is GBP"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Address (one line per row)" span="full">
            <TextArea
              value={(state.ukAddressLines ?? []).join('\n')}
              onChange={(v) => setAddress('ukAddressLines', v)}
              rows={4}
              placeholder={
                'Leave blank if you invoice from your India address'
              }
            />
          </Field>
          <Field label="VAT number (optional)">
            <TextInput
              value={state.vatNumber ?? ''}
              onChange={(v) => setField('vatNumber', v)}
              placeholder="Leave blank until VAT-registered"
            />
          </Field>
          <Field label="Company registration no. (optional)">
            <TextInput
              value={state.companyRegistrationNumber ?? ''}
              onChange={(v) => setField('companyRegistrationNumber', v)}
              placeholder="15 246 811"
            />
          </Field>
          <Field label="Bank name">
            <TextInput
              value={state.ukBankName ?? ''}
              onChange={(v) => setField('ukBankName', v)}
              placeholder="Barclays UK"
            />
          </Field>
          <Field label="Account holder">
            <TextInput
              value={state.ukAccountHolder ?? ''}
              onChange={(v) => setField('ukAccountHolder', v)}
            />
          </Field>
          <Field label="Sort code">
            <TextInput
              value={state.ukSortCode ?? ''}
              onChange={(v) => setField('ukSortCode', v)}
              placeholder="20-25-83"
            />
          </Field>
          <Field label="Account number">
            <TextInput
              value={state.ukAccountNumber ?? ''}
              onChange={(v) => setField('ukAccountNumber', v)}
            />
          </Field>
        </div>
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {result?.ok && (
          <div className="inline-flex items-center gap-1.5 text-xs text-accent font-mono uppercase tracking-[0.16em] font-bold">
            <Check size={13} />
            Saved
          </div>
        )}
        {result && !result.ok && (
          <div className="inline-flex items-center gap-1.5 text-xs text-[#ff6b6b] font-mono uppercase tracking-[0.16em] font-bold">
            <AlertCircle size={13} />
            {result.error}
          </div>
        )}
        <button
          type="submit"
          disabled={saving || !state.legalName}
          className="h-11 px-6 rounded-xl font-mono uppercase tracking-[0.18em] font-bold flex items-center gap-2"
          style={{
            fontSize: 11,
            color: '#0a0c09',
            background: 'linear-gradient(135deg, #d4ff5a 0%, #a8e60a 100%)',
            opacity: saving || !state.legalName ? 0.5 : 1,
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-5 md:p-6">
      <div className="mb-4">
        <h2 className="font-display font-semibold text-lg tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
  span,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  span?: 'full';
}) {
  return (
    <div className={span === 'full' ? 'md:col-span-2' : undefined}>
      <label className="block font-mono uppercase tracking-[0.16em] font-bold text-[10px] text-text-muted mb-1.5">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm resize-none"
    />
  );
}
