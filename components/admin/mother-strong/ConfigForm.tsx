'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/cn';
import { updateMotherStrongConfig } from '@/lib/actions/mother-strong';
import { type MotherStrongConfig } from '@/lib/data/mother-strong-types';

export function ConfigForm({ initial }: { initial: MotherStrongConfig }) {
  const router = useRouter();
  const [challengeStartDate, setChallengeStartDate] = useState(
    initial.challengeStartDate ?? ''
  );
  const [dailyGoal, setDailyGoal] = useState(String(initial.dailyGoal));
  const [whatsappGroupLink, setWhatsappGroupLink] = useState(
    initial.whatsappGroupLink ?? ''
  );
  const [cohortLabel, setCohortLabel] = useState(initial.cohortLabel ?? '');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const r = await updateMotherStrongConfig({
        challengeStartDate: challengeStartDate || null,
        dailyGoal: parseInt(dailyGoal, 10),
        whatsappGroupLink: whatsappGroupLink.trim(),
        cohortLabel: cohortLabel.trim(),
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-xl rounded-2xl bg-bg-card border border-border p-5 md:p-6 space-y-5"
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
          Cohort settings
        </div>
        <h3 className="font-display font-semibold text-lg tracking-tight">
          Configure the program
        </h3>
        <p className="text-xs text-text-muted leading-relaxed mt-1">
          These values shape the public registration page, leaderboard, and
          success screens. Changes apply immediately.
        </p>
      </div>

      <Field
        label="Challenge start date"
        help="The shared 'Day 1' for the cohort. Each participant's individual 60-day window still starts when they register; this date drives the public 'Day X of 60' headline."
      >
        <input
          type="date"
          value={challengeStartDate}
          onChange={(e) => setChallengeStartDate(e.target.value)}
          className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm font-mono focus:border-accent focus:outline-none"
        />
      </Field>

      <Field label="Daily goal (steps)" help="Default 10,000.">
        <input
          type="number"
          min={1000}
          max={50000}
          step={500}
          value={dailyGoal}
          onChange={(e) => setDailyGoal(e.target.value)}
          className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
        />
      </Field>

      <Field
        label="WhatsApp group link"
        help="Shown on the success screen after registration."
      >
        <input
          type="url"
          value={whatsappGroupLink}
          onChange={(e) => setWhatsappGroupLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/…"
          className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm font-mono focus:border-accent focus:outline-none"
        />
      </Field>

      <Field
        label="Cohort label"
        help="Appears on the gratitude card and the leaderboard heading."
      >
        <input
          type="text"
          value={cohortLabel}
          onChange={(e) => setCohortLabel(e.target.value)}
          placeholder="Mother's Day 2026"
          className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
        />
      </Field>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="text-[10px] text-text-muted font-mono">
          {savedAt && Date.now() - savedAt < 4000 ? (
            <span className="text-accent">✓ Saved</span>
          ) : (
            'Changes take effect immediately on save.'
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-2 h-10 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save size={13} strokeWidth={2.5} />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
        {label}
      </div>
      {children}
      {help && (
        <div className="text-[11px] text-text-muted mt-1.5 leading-relaxed">
          {help}
        </div>
      )}
    </label>
  );
}
