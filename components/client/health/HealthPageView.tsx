'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Moon,
  Footprints,
  Droplets,
  Stethoscope,
  AlertCircle,
  HeartPulse,
} from 'lucide-react';
import { BodyMeasurementsCard } from '@/components/client/dashboard/BodyMeasurementsCard';
import { HealthPassportCard } from '@/components/client/dashboard/HealthPassportCard';
import { ExtractedMarkersCard } from '@/components/client/health/ExtractedMarkersCard';
import {
  MOOD_META,
  type MoodState,
} from '@/lib/data/mood';
import type {
  BodyMeasurements,
  ProfileBodySettings,
} from '@/lib/data/body-measurements';
import type { BodyProportions } from '@/lib/data/body-proportions';
import type { HealthReport } from '@/lib/data/health-reports';
import type { DailyInputs } from '@/lib/data/twin';
import {
  COMMON_CONDITIONS,
  hasAnyHealthData,
  type HealthConditionsProfile,
} from '@/lib/data/health-conditions';

interface Props {
  measurements: BodyMeasurements | null;
  bodySettings: ProfileBodySettings;
  proportions: BodyProportions | null;
  healthReports: HealthReport[];
  moodHistory: Array<{ log_date: string; mood_state: MoodState | null }>;
  dailyInputs: DailyInputs;
  healthConditions: HealthConditionsProfile;
}

/**
 * HealthPageView — body-data hub.
 *
 * Composes existing cards (BodyMeasurementsCard, HealthPassportCard)
 * plus three new mini-sections: DailyVitalsCard, MoodPatternCard,
 * HealthConditionsCard. No new server actions or DB schema for the
 * conditions section in this iteration — it's a placeholder UI that
 * tells the user the coach will populate it (real persistence comes
 * with a follow-up migration when the coach-side admin flow is built).
 */
export function HealthPageView({
  measurements,
  bodySettings,
  proportions,
  healthReports,
  moodHistory,
  dailyInputs,
  healthConditions,
}: Props) {
  return (
    <div className="space-y-5">
      {/* 1 — Daily Vitals snapshot. First because it's the freshest
          signal (what your body did TODAY). */}
      <DailyVitalsCard inputs={dailyInputs} />

      {/* 2 — Body Measurements (moved from dashboard) */}
      <BodyMeasurementsCard
        latest={measurements}
        profileSettings={bodySettings}
      />

      {/* 3a — Extracted lab markers (Gemini vision pulls structured
              values out of the user's uploaded reports). Renders an
              empty state when no reports are extracted yet, so this
              card is always present as a hint. */}
      <ExtractedMarkersCard reports={healthReports} />

      {/* 3b — Health Passport (raw file list — view / delete / re-extract) */}
      <HealthPassportCard initialReports={healthReports} />

      {/* 4 — Mood pattern (last 7 days) */}
      <MoodPatternCard history={moodHistory} />

      {/* 5 — Health conditions (now persisted; read-only for client) */}
      <HealthConditionsCard
        conditions={healthConditions}
        proportions={proportions}
        bodySettings={bodySettings}
      />
    </div>
  );
}

// ─── Daily Vitals card ──────────────────────────────────────────

function DailyVitalsCard({ inputs }: { inputs: DailyInputs }) {
  const items: Array<{
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    value: string;
    sub: string;
    color: string;
  }> = [
    {
      icon: Footprints,
      label: 'Steps',
      value: inputs.steps.toLocaleString(),
      sub: `of ${inputs.stepsGoal.toLocaleString()}`,
      color: '#c6ff3d',
    },
    {
      icon: Moon,
      label: 'Sleep',
      value:
        inputs.sleepMinutes > 0
          ? `${(inputs.sleepMinutes / 60).toFixed(1)}h`
          : '—',
      sub: `of ${(inputs.sleepGoalMinutes / 60).toFixed(0)}h`,
      color: '#a78bfa',
    },
    {
      icon: Droplets,
      label: 'Water',
      value:
        inputs.waterMl > 0
          ? `${(inputs.waterMl / 1000).toFixed(1)}L`
          : '—',
      sub: `of ${(inputs.waterGoalMl / 1000).toFixed(1)}L`,
      color: '#7dd3ff',
    },
    {
      icon: Activity,
      label: 'Workouts (7d)',
      value: String(inputs.workoutsLast7),
      sub: `of 7 days`,
      color: '#ff8a4d',
    },
  ];

  return (
    <section
      className="rounded-3xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(125,211,255,0.10) 0%, transparent 60%),
          linear-gradient(180deg, #0f1316 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(125,211,255,0.22)',
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: '#7dd3ff' }}
        >
          <HeartPulse size={11} />
          Daily Vitals
        </div>
        <span
          className="font-mono uppercase tracking-[0.16em] font-bold"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
        >
          Today
        </span>
      </div>
      <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="rounded-xl border px-3 py-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 9, color: it.color }}
              >
                <Icon size={11} />
                {it.label}
              </div>
              <div
                className="font-display font-bold tabular-nums leading-none mt-1.5"
                style={{ fontSize: 22, color: 'rgba(245,245,240,0.95)' }}
              >
                {it.value}
              </div>
              <div
                className="font-mono mt-0.5"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
              >
                {it.sub}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Mood Pattern card ──────────────────────────────────────────

function MoodPatternCard({
  history,
}: {
  history: Array<{ log_date: string; mood_state: MoodState | null }>;
}) {
  // Build a 7-day view from today back; fill missing days with null
  const days: Array<{ date: string; mood: MoodState | null }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const found = history.find((h) => h.log_date === iso);
    days.push({ date: iso, mood: found?.mood_state ?? null });
  }

  const loggedCount = days.filter((d) => d.mood !== null).length;
  // Calculate the dominant mood over the 7-day window. Wrapping in
  // an IIFE confused TS's flow narrowing (it tagged the closed-over
  // `best` variable as `never`), so we use a plain reduce here.
  const counts: Record<string, number> = {};
  for (const h of history) {
    if (h.mood_state) {
      counts[h.mood_state] = (counts[h.mood_state] ?? 0) + 1;
    }
  }
  let dominantMood: MoodState | null = null;
  let dominantCount = 0;
  for (const [k, c] of Object.entries(counts)) {
    if (c > dominantCount) {
      dominantCount = c;
      dominantMood = k as MoodState;
    }
  }

  return (
    <section
      className="rounded-3xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 60%),
          linear-gradient(180deg, #0e0d12 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(167,139,250,0.22)',
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: '#a78bfa' }}
        >
          <HeartPulse size={11} />
          Mood Pattern · last 7 days
        </div>
        <span
          className="font-mono uppercase tracking-[0.16em] font-bold"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
        >
          {loggedCount} / 7 logged
        </span>
      </div>

      <div className="px-5 pb-3">
        {loggedCount === 0 ? (
          <p
            className="leading-relaxed"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}
          >
            No mood logged yet. Tap the morning check-in on your Home
            screen to start tracking patterns.
          </p>
        ) : (
          <>
            {dominantMood && (
              <p
                className="leading-relaxed mb-1"
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
              >
                Most common:{' '}
                <span
                  className="font-bold"
                  style={{ color: MOOD_META[dominantMood].color }}
                >
                  {MOOD_META[dominantMood].emoji}{' '}
                  {MOOD_META[dominantMood].label}
                </span>
              </p>
            )}
            <p
              className="leading-snug"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
            >
              Use this pattern to spot recurring fatigue, soreness, or
              digestive issues. Coach can suggest adjustments.
            </p>
          </>
        )}
      </div>

      <div className="px-5 pb-5 grid grid-cols-7 gap-1.5">
        {days.map(({ date, mood }) => {
          const dt = new Date(date + 'T00:00:00');
          const weekday = dt
            .toLocaleDateString('en-GB', { weekday: 'short' })
            .slice(0, 1);
          const dayNum = dt.getDate();
          const color = mood ? MOOD_META[mood].color : '#5a6055';
          const bg = mood
            ? `${MOOD_META[mood].color}25`
            : 'rgba(255,255,255,0.03)';
          const border = mood
            ? `${MOOD_META[mood].color}55`
            : 'rgba(255,255,255,0.06)';
          return (
            <div
              key={date}
              title={
                mood
                  ? `${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${MOOD_META[mood].label}`
                  : `${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · no log`
              }
              className="aspect-square rounded-md border flex flex-col items-center justify-center"
              style={{ background: bg, borderColor: border }}
            >
              <span
                className="font-mono uppercase font-bold leading-none"
                style={{ fontSize: 8, color, opacity: 0.75 }}
              >
                {weekday}
              </span>
              {mood ? (
                <span style={{ fontSize: 14, lineHeight: 1, marginTop: 2 }}>
                  {MOOD_META[mood].emoji}
                </span>
              ) : (
                <span
                  className="font-display font-bold tabular-nums leading-none mt-1"
                  style={{ fontSize: 12, color }}
                >
                  {dayNum}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Health Conditions card (stub for v1) ───────────────────────

function HealthConditionsCard({
  conditions,
  proportions: _proportions,
  bodySettings: _bodySettings,
}: {
  conditions: HealthConditionsProfile;
  proportions: BodyProportions | null;
  bodySettings: ProfileBodySettings;
}) {
  const hasData = hasAnyHealthData(conditions);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-3xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(255,138,77,0.06) 0%, transparent 60%),
          linear-gradient(180deg, #14110d 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(255,138,77,0.20)',
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: '#ff8a4d' }}
        >
          <Stethoscope size={11} />
          Health Conditions
        </div>
        {hasData && conditions.updatedAt && (
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
          >
            Updated{' '}
            {new Date(conditions.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
      </div>

      {hasData ? (
        <>
          <div className="px-5 pb-3">
            <h3
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
            >
              Your coach&apos;s notes
            </h3>
          </div>

          {conditions.conditions.length > 0 && (
            <ChipSection title="Conditions" items={conditions.conditions} color="#ff8a4d" />
          )}
          {conditions.allergies.length > 0 && (
            <ChipSection title="Allergies" items={conditions.allergies} color="#ff6b6b" />
          )}
          {conditions.injuries.length > 0 && (
            <ChipSection title="Injuries" items={conditions.injuries} color="#ffd24d" />
          )}
          {conditions.medications.length > 0 && (
            <ChipSection
              title="Medications"
              items={conditions.medications}
              color="#a78bfa"
            />
          )}
          {conditions.coachNotes && conditions.coachNotes.trim() && (
            <div className="px-5 pb-4">
              <div
                className="font-mono uppercase tracking-[0.14em] font-bold mb-1.5"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
              >
                Notes
              </div>
              <div
                className="rounded-xl px-3 py-2.5 whitespace-pre-wrap leading-relaxed"
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {conditions.coachNotes}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="px-5 pb-3">
            <h3
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
            >
              No conditions on file
            </h3>
            <p
              className="mt-1 leading-snug"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}
            >
              Your coach will add conditions, allergies, injuries, and
              medications here — they use this to tailor your workouts
              and meal plan.
            </p>
          </div>
          <div className="px-5 pb-5">
            <div
              className="font-mono uppercase tracking-[0.14em] font-bold mb-2"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
            >
              Examples of what your coach tracks
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONDITIONS.slice(0, 8).map((c) => (
                <span
                  key={c}
                  className="font-mono text-[10px] px-2 py-1 rounded-full"
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        className="px-5 py-3 border-t flex items-start gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <AlertCircle
          size={12}
          style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0, marginTop: 2 }}
        />
        <p
          className="leading-relaxed"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
        >
          PureX Health tracks your data for coaching purposes only — not
          a substitute for medical diagnosis or treatment. Always consult
          a qualified doctor before making decisions about your health,
          medication, or treatment.
        </p>
      </div>
    </motion.section>
  );
}

function ChipSection({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="px-5 pb-3">
      <div
        className="font-mono uppercase tracking-[0.14em] font-bold mb-1.5"
        style={{ fontSize: 9, color }}
      >
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="px-2 py-1 rounded-full"
            style={{
              fontSize: 11,
              color: 'rgba(245,245,240,0.92)',
              background: `${color}14`,
              border: `1px solid ${color}33`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
