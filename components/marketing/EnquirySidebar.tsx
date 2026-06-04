import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';

/**
 * Sidebar that sits beside the EnquiryForm on /apply.
 *
 * Three blocks (mirrors the Mother Strong sidebar pattern):
 *   1. What happens next  — 4-step timeline so the visitor knows
 *                           exactly what to expect after submitting
 *   2. Our coaching philosophy — three short principles
 *   3. Privacy + WhatsApp follow-up note (soft trust signal)
 *
 * Sticky on desktop so the encouragement stays visible while the
 * visitor scrolls the form. Stacks above the form on mobile.
 */
export function EnquirySidebar() {
  return (
    <aside
      aria-label="What to expect when you apply"
      className="space-y-5 md:sticky md:top-24 self-start"
    >
      {/* What happens next */}
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-card to-bg-card p-5 md:p-6">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
          <Sparkles size={11} />
          What happens next
        </div>

        <div className="relative pl-7">
          <span
            aria-hidden
            className="absolute left-[10px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-accent/60 via-accent/30 to-accent/10"
          />
          <Step
            n="1"
            title="You submit this form"
            body="Takes 60 seconds. You get an instant confirmation."
          />
          <Step
            n="2"
            title="We reach out personally"
            body="Within 24 hours, by WhatsApp. From a real coach, not a chatbot."
          />
          <Step
            n="3"
            title="Discovery call"
            body="20 minutes. We map your current state, goals, and constraints honestly."
          />
          <Step
            n="4"
            title="A plan tailored to you"
            body="If we&rsquo;re the right fit, you get a coach assignment and Day 1 within the week."
            last
          />
        </div>
      </div>

      {/* Coaching philosophy */}
      <div className="rounded-2xl border border-border bg-bg-card p-5 md:p-6">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold mb-4">
          <Activity size={11} className="text-accent" />
          How we work
        </div>
        <ul className="space-y-3.5">
          <Principle
            icon={<Users size={14} />}
            title="Five specialists, one plan"
            body="PT lead, doctor, physio, mental performance, ops — coordinated, not siloed."
          />
          <Principle
            icon={<CalendarClock size={14} />}
            title="100-day commitment"
            body="We don&rsquo;t promise transformations in 30 days because they don&rsquo;t last."
          />
          <Principle
            icon={<CheckCircle2 size={14} />}
            title="Witnessed accountability"
            body="Daily logs you fill, your coach sees. No hiding, no guessing."
          />
        </ul>
      </div>

      {/* Privacy / WhatsApp trust */}
      <div
        className="rounded-2xl border border-border-soft bg-bg-card/60 p-4 flex items-start gap-3"
      >
        <Lock size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        <p
          className="text-text-muted leading-relaxed"
          style={{ fontSize: 12 }}
        >
          Your details stay private. We use them once, to follow up. No
          marketing list, no third-party sharing, no sales calls — just a
          WhatsApp message from a coach.
        </p>
      </div>
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Step({
  n,
  title,
  body,
  last,
}: {
  n: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div className={`relative ${last ? '' : 'pb-5'}`}>
      <span
        aria-hidden
        className="absolute -left-7 top-0 w-[18px] h-[18px] rounded-full bg-bg-card border border-accent/60 flex items-center justify-center"
      >
        <span
          className="font-mono font-bold text-accent"
          style={{ fontSize: 10 }}
        >
          {n}
        </span>
      </span>
      <div
        className="font-display font-semibold tracking-tight leading-snug"
        style={{ fontSize: 15 }}
      >
        {title}
      </div>
      <p
        className="text-text-muted leading-relaxed mt-1"
        style={{ fontSize: 13 }}
      >
        {body}
      </p>
    </div>
  );
}

function Principle({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/12 text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className="font-display font-semibold text-text leading-snug"
          style={{ fontSize: 14 }}
        >
          {title}
        </div>
        <p
          className="text-text-muted leading-relaxed mt-0.5"
          style={{ fontSize: 12.5 }}
        >
          {body}
        </p>
      </div>
    </li>
  );
}
