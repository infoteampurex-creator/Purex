import {
  Eye,
  Footprints,
  Award,
  CalendarHeart,
  Lock,
  Smartphone,
  Heart,
  Sparkles,
} from 'lucide-react';

/**
 * Motivational / instructional side panel that sits alongside the
 * registration form on /mother-strong. On desktop it's sticky so the
 * mother sees the encouragement no matter how far down the form she
 * scrolls. On mobile it collapses to a stacked column above the form
 * so it lands first.
 *
 * Three sections:
 *  1. Why this works — three short reasons that handle the most common
 *     objections ("Will I have to log a thing?", "Will anyone see?",
 *     "What do I get at the end?").
 *  2. The 60-day arc — a tiny visual timeline so the offer feels
 *     concrete, not open-ended.
 *  3. Trust signals — four small badges (Free / Private / No app /
 *     Real team) and a soft pull-quote that grounds the program in a
 *     real human story.
 */
export function RegistrationSidebar() {
  return (
    <aside
      aria-label="Why join Mother Strong"
      className="space-y-5 md:sticky md:top-24 self-start"
    >
      {/* Why this works */}
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-card to-bg-card p-5 md:p-6">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
          <Sparkles size={11} />
          Why this works
        </div>
        <ul className="space-y-4">
          <Reason
            icon={<Footprints size={16} />}
            title="You don’t log a thing."
            body="Your team logs every day’s steps for you. You just walk — through the kitchen, the park, the lane, the staircase."
          />
          <Reason
            icon={<Eye size={16} />}
            title="The cohort sees you."
            body="Your name climbs the public leaderboard each day. You show up because someone is watching, and someone is rooting for you."
          />
          <Reason
            icon={<Award size={16} />}
            title="A keepsake at the end."
            body="On Day 60 we hand you a personal gratitude card — your numbers, your story, your name. A real record you can keep."
          />
        </ul>
      </div>

      {/* The 60-day arc */}
      <div className="rounded-2xl border border-border bg-bg-card p-5 md:p-6">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold mb-4">
          <CalendarHeart size={11} className="text-accent" />
          The 60-day arc
        </div>

        <div className="relative pl-7">
          {/* vertical rule */}
          <span
            aria-hidden
            className="absolute left-[10px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-accent/60 via-accent/30 to-accent/10"
          />
          <Milestone
            day="Day 1"
            title="Welcome + WhatsApp group"
            body="You join the cohort’s WhatsApp group. Your first day starts the moment you say yes."
          />
          <Milestone
            day="Day 30"
            title="Half-way photo"
            body="A cohort photo lands on the public page. You see your name climbing the board."
          />
          <Milestone
            day="Day 60"
            title="Gratitude card delivered"
            body="A personal PNG with your stats, sent to your WhatsApp. Yours forever."
            last
          />
        </div>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-2 gap-2">
        <TrustBadge icon={<Sparkles size={12} />} label="Free, forever" />
        <TrustBadge icon={<Lock size={12} />} label="Your data, private" />
        <TrustBadge icon={<Smartphone size={12} />} label="No app to install" />
        <TrustBadge icon={<Heart size={12} />} label="Real human team" />
      </div>

      {/* Quiet pull-quote */}
      <blockquote className="rounded-2xl border border-border-soft bg-bg-card/60 p-5">
        <p
          className="text-text leading-relaxed italic"
          style={{ fontSize: 15 }}
        >
          “I tied my shoes after work and went again. Sixty days. My husband
          watched me walking every evening. Something shifted.”
        </p>
        <footer className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
          — A mother, last cohort
        </footer>
      </blockquote>
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Reason({
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
      <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className="font-display font-semibold text-text leading-snug"
          style={{ fontSize: 16 }}
        >
          {title}
        </div>
        <p
          className="text-text-muted leading-relaxed mt-1"
          style={{ fontSize: 14 }}
        >
          {body}
        </p>
      </div>
    </li>
  );
}

function Milestone({
  day,
  title,
  body,
  last,
}: {
  day: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div className={`relative ${last ? '' : 'pb-5'}`}>
      <span
        aria-hidden
        className="absolute -left-7 top-1.5 w-[7px] h-[7px] rounded-full bg-accent ring-2 ring-bg-card"
      />
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent font-bold mb-0.5">
        {day}
      </div>
      <div
        className="font-display font-semibold tracking-tight leading-snug"
        style={{ fontSize: 15 }}
      >
        {title}
      </div>
      <p className="text-text-muted leading-relaxed mt-1" style={{ fontSize: 13 }}>
        {body}
      </p>
    </div>
  );
}

function TrustBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-card/60 border border-border-soft">
      <span className="text-accent flex-shrink-0">{icon}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold leading-tight">
        {label}
      </span>
    </div>
  );
}
