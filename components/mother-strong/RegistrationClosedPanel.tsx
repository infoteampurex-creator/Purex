import Link from 'next/link';
import { Lock, CalendarClock, ArrowRight, MessageCircle } from 'lucide-react';

interface Props {
  /** ISO YYYY-MM-DD when the cohort goes live. Null if not scheduled yet. */
  challengeStartDate: string | null;
  /** Public WhatsApp group invite link, if configured. */
  whatsappGroupLink: string | null;
}

/**
 * Renders in place of the registration form on /mother-strong when
 * the cohort is not live yet. Visitors still see the hero + the
 * motivational sidebar; this panel just makes it explicit that the
 * sign-up form unlocks on launch day, and channels their interest
 * to the WhatsApp group (or the leaderboard) in the meantime.
 *
 * Designed to feel premium — gold-tinted to match the homepage
 * "Coming soon" card — not punitive. Use of cohortStartDate is
 * formatted for human reading; countdown phrasing matches the
 * homepage card.
 */
export function RegistrationClosedPanel({
  challengeStartDate,
  whatsappGroupLink,
}: Props) {
  const launch = formatLaunch(challengeStartDate);

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-6 md:p-8 lg:p-10"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, rgba(212, 160, 80, 0.14) 0%, transparent 55%),
          radial-gradient(ellipse at 100% 100%, rgba(255, 245, 204, 0.06) 0%, transparent 60%),
          linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
        `,
        boxShadow:
          '0 0 0 1px rgba(212, 160, 80, 0.30), 0 10px 40px rgba(212, 160, 80, 0.08)',
      }}
    >
      {/* Lock icon */}
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
        style={{
          background: 'rgba(212, 160, 80, 0.15)',
          color: '#d4a050',
        }}
      >
        <Lock size={24} />
      </div>

      {/* Headline */}
      <div
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
        style={{ color: '#d4a050' }}
      >
        <CalendarClock size={12} />
        {launch ? 'Registration opens' : 'Coming soon'}
      </div>

      <h2
        className="font-display font-semibold tracking-tight leading-tight mb-4"
        style={{ fontSize: 32 }}
      >
        <span
          style={{
            background:
              'linear-gradient(135deg, #ffffff 0%, #ffe69a 60%, #d4a050 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {launch ? launch.dateLabel : 'Cohort opening soon.'}
        </span>
      </h2>

      <p
        className="text-text-muted leading-relaxed mb-6"
        style={{ fontSize: 16 }}
      >
        {launch
          ? `We're keeping this cohort small and intentional. Registration unlocks ${launch.countdownLabel.toLowerCase()} — ${launch.dateLabel}. Join the WhatsApp group below to be notified the moment the form opens.`
          : "We're finalising the next cohort. Join the WhatsApp group below to be the first to know when registration opens."}
      </p>

      {/* Primary CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {whatsappGroupLink ? (
          <a
            href={whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full font-semibold transition-all hover:opacity-95"
            style={{
              height: 52,
              minHeight: 52,
              fontSize: 16,
              background: '#25D366',
              color: '#ffffff',
              boxShadow: '0 4px 18px rgba(37, 211, 102, 0.25)',
            }}
          >
            <MessageCircle size={16} strokeWidth={2.5} />
            Join the WhatsApp group
          </a>
        ) : (
          <span
            className="inline-flex items-center justify-center gap-2 px-6 rounded-full font-semibold opacity-60 cursor-not-allowed"
            style={{
              height: 52,
              minHeight: 52,
              fontSize: 16,
              background: 'rgba(212, 160, 80, 0.20)',
              color: '#d4a050',
            }}
          >
            <MessageCircle size={16} />
            WhatsApp link coming soon
          </span>
        )}
        <Link
          href="/mother-strong/leaderboard"
          className="inline-flex items-center justify-center gap-2 px-6 rounded-full border font-semibold transition-colors"
          style={{
            height: 52,
            minHeight: 52,
            fontSize: 16,
            borderColor: 'rgba(212, 160, 80, 0.35)',
            color: '#d4a050',
            background: 'rgba(212, 160, 80, 0.05)',
          }}
        >
          See how it works
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Soft reassurance */}
      <div
        className="pt-4 mt-4 text-xs leading-relaxed"
        style={{
          borderTop: '1px solid rgba(212, 160, 80, 0.15)',
          color: 'rgba(212, 160, 80, 0.7)',
        }}
      >
        Free to join · No app to install · 60 days · Witnessed by the team
      </div>
    </div>
  );
}

// ─── Date / countdown formatter (mirrors MotherStrongTeaser) ──────

function formatLaunch(
  challengeStartDate: string | null
): { dateLabel: string; countdownLabel: string } | null {
  if (!challengeStartDate) return null;

  const start = new Date(challengeStartDate + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return null;

  const today = new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) +
      'T00:00:00'
  );

  const diffDays = Math.floor(
    (start.getTime() - today.getTime()) / 86400000
  );
  if (diffDays < 0) return null;

  const dateLabel = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let countdownLabel: string;
  if (diffDays === 0) countdownLabel = 'Today';
  else if (diffDays === 1) countdownLabel = 'Tomorrow';
  else if (diffDays < 7) countdownLabel = `In ${diffDays} days`;
  else if (diffDays < 60) countdownLabel = `In ${Math.round(diffDays / 7)} weeks`;
  else countdownLabel = `In ~${Math.round(diffDays / 30)} months`;

  return { dateLabel, countdownLabel };
}
