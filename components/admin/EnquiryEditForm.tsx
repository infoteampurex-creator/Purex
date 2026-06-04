'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, PencilLine, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { updateEnquiryFields } from '@/lib/actions/enquiries';
import {
  PRIMARY_GOAL_OPTIONS,
  START_TIMING_OPTIONS,
  LEAD_TEMPERATURE_OPTIONS,
  PLAN_DISCUSSED_OPTIONS,
  NEXT_STEP_OPTIONS,
  type AdminEnquiry,
  type EnquiryAdminData,
  type LeadTemperature,
  type PlanDiscussed,
  type NextStep,
  type PrimaryGoal,
  type StartTiming,
} from '@/lib/data/enquiries-types';

interface Props {
  enquiry: AdminEnquiry;
}

/**
 * Admin "Edit & enrich" panel.
 *
 * Replaces the read-only Answers card. Combines:
 *  1. Applicant-submitted fields (editable, but locked behind a toggle
 *     to prevent accidental typos overwriting what the visitor typed)
 *  2. Admin-only discovery fields stored in admin_data JSONB —
 *     captured during the qualifying call.
 *
 * One save button at the bottom commits both buckets in one round-trip.
 */
export function EnquiryEditForm({ enquiry }: Props) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Applicant fields
  const [fullName, setFullName] = useState(enquiry.fullName);
  const [whatsapp, setWhatsapp] = useState(enquiry.whatsapp);
  const [email, setEmail] = useState(enquiry.email);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    enquiry.primaryGoal
  );
  const [startTiming, setStartTiming] = useState<StartTiming>(
    enquiry.startTiming
  );
  const [message, setMessage] = useState(enquiry.message ?? '');

  // Admin discovery fields
  const initialAdmin = enquiry.adminData ?? {};
  const [temperature, setTemperature] = useState<LeadTemperature | ''>(
    initialAdmin.temperature ?? ''
  );
  const [planDiscussed, setPlanDiscussed] = useState<PlanDiscussed | ''>(
    initialAdmin.plan_discussed ?? ''
  );
  const [pricingDiscussed, setPricingDiscussed] = useState<boolean>(
    initialAdmin.pricing_discussed ?? false
  );
  const [budget, setBudget] = useState(initialAdmin.budget_inr ?? '');
  const [objections, setObjections] = useState(initialAdmin.objections ?? '');
  const [nextStep, setNextStep] = useState<NextStep | ''>(
    initialAdmin.next_step ?? ''
  );
  const [discoveryCallDate, setDiscoveryCallDate] = useState(
    initialAdmin.discovery_call_date ?? ''
  );
  const [followUpAt, setFollowUpAt] = useState(initialAdmin.follow_up_at ?? '');
  const [sourceChannel, setSourceChannel] = useState(
    initialAdmin.source_channel ?? ''
  );

  const dirty = useMemo(() => {
    const a = enquiry;
    if (fullName !== a.fullName) return true;
    if (whatsapp !== a.whatsapp) return true;
    if (email !== a.email) return true;
    if (primaryGoal !== a.primaryGoal) return true;
    if (startTiming !== a.startTiming) return true;
    if ((message ?? '') !== (a.message ?? '')) return true;
    if ((temperature || undefined) !== a.adminData?.temperature) return true;
    if ((planDiscussed || undefined) !== a.adminData?.plan_discussed)
      return true;
    if (pricingDiscussed !== (a.adminData?.pricing_discussed ?? false))
      return true;
    if ((budget || '') !== (a.adminData?.budget_inr ?? '')) return true;
    if ((objections || '') !== (a.adminData?.objections ?? '')) return true;
    if ((nextStep || undefined) !== a.adminData?.next_step) return true;
    if (
      (discoveryCallDate || '') !==
      (a.adminData?.discovery_call_date ?? '')
    )
      return true;
    if ((followUpAt || '') !== (a.adminData?.follow_up_at ?? ''))
      return true;
    if ((sourceChannel || '') !== (a.adminData?.source_channel ?? ''))
      return true;
    return false;
  }, [
    enquiry,
    fullName,
    whatsapp,
    email,
    primaryGoal,
    startTiming,
    message,
    temperature,
    planDiscussed,
    pricingDiscussed,
    budget,
    objections,
    nextStep,
    discoveryCallDate,
    followUpAt,
    sourceChannel,
  ]);

  const onSave = () => {
    setErrorMsg(null);
    const adminData: EnquiryAdminData = {};
    if (temperature) adminData.temperature = temperature;
    if (planDiscussed) adminData.plan_discussed = planDiscussed;
    adminData.pricing_discussed = pricingDiscussed;
    if (budget.trim()) adminData.budget_inr = budget.trim();
    if (objections.trim()) adminData.objections = objections.trim();
    if (nextStep) adminData.next_step = nextStep;
    if (discoveryCallDate) adminData.discovery_call_date = discoveryCallDate;
    if (followUpAt) adminData.follow_up_at = followUpAt;
    if (sourceChannel.trim()) adminData.source_channel = sourceChannel.trim();

    startTransition(async () => {
      const r = await updateEnquiryFields({
        enquiryId: enquiry.id,
        fullName,
        whatsapp,
        email,
        primaryGoal,
        startTiming,
        message: message.trim() || null,
        adminData,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  const inputCls =
    'w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed';
  const labelCls =
    'font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block';

  return (
    <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <PencilLine size={16} className="text-accent" strokeWidth={2.5} />
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Edit &amp; enrich
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setUnlocked((u) => !u)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] font-bold border transition-colors',
            unlocked
              ? 'border-amber/40 text-amber bg-amber/10 hover:bg-amber/15'
              : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
          )}
        >
          {unlocked ? <Unlock size={11} /> : <Lock size={11} />}
          {unlocked ? 'Editing applicant fields' : 'Edit applicant fields'}
        </button>
      </div>

      {/* ─── Applicant-submitted ─── */}
      <div className="mb-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold mb-3 pb-2 border-b border-border-soft">
          What they told us
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!unlocked}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) =>
                setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              disabled={!unlocked}
              inputMode="numeric"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!unlocked}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Primary goal</label>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value as PrimaryGoal)}
              disabled={!unlocked}
              className={inputCls}
            >
              {PRIMARY_GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Can start</label>
            <select
              value={startTiming}
              onChange={(e) => setStartTiming(e.target.value as StartTiming)}
              disabled={!unlocked}
              className={inputCls}
            >
              {START_TIMING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Message from applicant</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!unlocked}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* ─── Discovery / admin fields ─── */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3 pb-2 border-b border-accent/20">
          Discovery call · admin only
        </div>

        {/* Temperature — pill selector */}
        <div className="mb-4">
          <label className={labelCls}>Lead temperature</label>
          <div className="flex gap-2 flex-wrap">
            {LEAD_TEMPERATURE_OPTIONS.map((opt) => {
              const active = temperature === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setTemperature(active ? '' : (opt.value as LeadTemperature))
                  }
                  className={cn(
                    'px-3.5 py-2 rounded-full font-mono text-[12px] uppercase tracking-[0.14em] font-bold border transition-all',
                    active
                      ? ''
                      : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
                  )}
                  style={
                    active
                      ? {
                          color: opt.color,
                          borderColor: opt.color + '60',
                          background: opt.color + '15',
                        }
                      : {}
                  }
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                    style={{
                      background: active ? opt.color : '#3a4438',
                      boxShadow: active ? `0 0 6px ${opt.color}` : 'none',
                    }}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Plan discussed</label>
            <select
              value={planDiscussed}
              onChange={(e) =>
                setPlanDiscussed(e.target.value as PlanDiscussed | '')
              }
              className={inputCls}
            >
              <option value="">— Not yet —</option>
              {PLAN_DISCUSSED_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Budget mentioned (₹)</label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 15,000/month"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={cn(labelCls, 'mb-2')}>Pricing discussed</label>
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pricingDiscussed}
                onChange={(e) => setPricingDiscussed(e.target.checked)}
                className="w-4 h-4 rounded accent-accent cursor-pointer"
              />
              <span className="text-sm text-text">
                Yes — they know our pricing
              </span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Objections / concerns</label>
            <textarea
              value={objections}
              onChange={(e) => setObjections(e.target.value)}
              placeholder="e.g. needs to talk to spouse, worried about time commitment…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none"
              style={{ fontSize: 13 }}
            />
          </div>

          <div>
            <label className={labelCls}>Next step</label>
            <select
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value as NextStep | '')}
              className={inputCls}
            >
              <option value="">— Not decided —</option>
              {NEXT_STEP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Source channel</label>
            <input
              type="text"
              value={sourceChannel}
              onChange={(e) => setSourceChannel(e.target.value)}
              placeholder="Instagram / referral / Google…"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Discovery call date</label>
            <input
              type="date"
              value={discoveryCallDate}
              onChange={(e) => setDiscoveryCallDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Follow-up at</label>
            <input
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ─── Footer: save + status ─── */}
      <div className="mt-6 pt-5 border-t border-border-soft flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-text-muted min-h-[20px]">
          {errorMsg && <span className="text-danger">{errorMsg}</span>}
          {!errorMsg &&
            savedAt &&
            Date.now() - savedAt < 2500 &&
            !isPending && (
              <span className="text-accent font-mono uppercase tracking-[0.16em] font-bold">
                ✓ Saved
              </span>
            )}
          {!errorMsg && !savedAt && dirty && !isPending && (
            <span className="font-mono uppercase tracking-[0.16em] font-bold text-amber">
              · Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending || !dirty}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} strokeWidth={2.5} />
          )}
          Save changes
        </button>
      </div>
    </div>
  );
}
