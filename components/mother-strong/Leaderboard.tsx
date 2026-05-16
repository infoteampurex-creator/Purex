import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Flame, Footprints, Sparkles, ArrowRight } from 'lucide-react';
import { type LeaderboardRow } from '@/lib/data/mother-strong-types';

interface Props {
  rows: LeaderboardRow[];
  dailyGoal: number;
}

/**
 * Public leaderboard for /mother-strong/leaderboard.
 *
 * Layout:
 *   - Top 3 → big podium cards (gold/silver/bronze accent).
 *   - Ranks 4-50 → compact table (mobile = stacked card, desktop = grid).
 *   - Empty state → friendly nudge with a CTA to register.
 */
export function Leaderboard({ rows, dailyGoal }: Props) {
  if (rows.length === 0) {
    return <EmptyState />;
  }

  const topThree = rows.slice(0, 3);
  const rest = rows.slice(3, 50);

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Podium — top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {topThree.map((row, i) => (
          <PodiumCard
            key={row.id}
            rank={i + 1}
            row={row}
            dailyGoal={dailyGoal}
          />
        ))}
      </div>

      {/* Ranks 4-50 */}
      {rest.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-4">
            Ranks 4 – {Math.min(3 + rest.length, 50)}
          </div>
          {/* Mobile: stacked cards */}
          <div className="md:hidden space-y-2">
            {rest.map((row, i) => (
              <RankCardMobile
                key={row.id}
                rank={i + 4}
                row={row}
                dailyGoal={dailyGoal}
              />
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl bg-bg-card border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  {['Rank', 'Mother', 'City', 'Days hit', 'Total steps', 'Streak', 'Consistency'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rest.map((row, i) => (
                  <RankRow
                    key={row.id}
                    rank={i + 4}
                    row={row}
                    dailyGoal={dailyGoal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Podium card (top 3) ───────────────────────────────────────────

function PodiumCard({
  rank,
  row,
  dailyGoal,
}: {
  rank: number;
  row: LeaderboardRow;
  dailyGoal: number;
}) {
  const colors = {
    1: { border: 'border-accent/60', bg: 'bg-accent/5', text: 'text-accent', label: 'GOLD' },
    2: { border: 'border-text-muted/40', bg: 'bg-bg-elevated/60', text: 'text-text', label: 'SILVER' },
    3: { border: 'border-amber/50', bg: 'bg-amber/5', text: 'text-amber', label: 'BRONZE' },
  }[rank as 1 | 2 | 3];

  return (
    <div
      className={`relative rounded-2xl border ${colors.border} ${colors.bg} p-5 md:p-6 transition-shadow hover:shadow-lg`}
    >
      {/* Rank badge */}
      <div className="absolute -top-3 -left-3 w-11 h-11 rounded-full bg-bg-card border border-border-soft flex items-center justify-center">
        <span
          className={`font-display font-bold ${colors.text}`}
          style={{ fontSize: 22 }}
        >
          {rank}
        </span>
      </div>

      <div
        className={`absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.18em] font-bold ${colors.text}`}
      >
        {colors.label}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mt-3">
        <Avatar
          name={row.publicName}
          url={row.publicPhotoUrl}
          size={56}
        />
        <div className="min-w-0">
          <div className="font-display font-semibold text-lg tracking-tight truncate">
            {row.publicName}
          </div>
          <div className="text-xs text-text-muted truncate">{row.city}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <PodiumStat
          icon={<Trophy size={11} />}
          label="Days hit"
          value={`${row.daysHitGoal}`}
          sub={`/ ${row.daysElapsed}`}
        />
        <PodiumStat
          icon={<Flame size={11} />}
          label="Streak"
          value={`${row.currentStreak}`}
          sub="days"
        />
        <PodiumStat
          icon={<Footprints size={11} />}
          label="Total"
          value={formatStepsCompact(row.totalSteps)}
          sub="steps"
        />
      </div>

      {/* Consistency bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
            Consistency
          </span>
          <span className={`font-mono text-xs font-bold tabular-nums ${colors.text}`}>
            {row.consistencyPct.toFixed(0)}%
          </span>
        </div>
        <div className="relative h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all"
            style={{ width: `${Math.min(row.consistencyPct, 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-text-dim mt-1 font-mono">
          Goal: {dailyGoal.toLocaleString('en-IN')} steps / day
        </div>
      </div>
    </div>
  );
}

function PodiumStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg bg-bg-card/60 border border-border-soft px-2 py-2 text-center">
      <div className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted font-bold">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <div className="font-display font-bold text-base tabular-nums mt-0.5">
        {value}
      </div>
      <div className="text-[10px] text-text-dim font-mono">{sub}</div>
    </div>
  );
}

// ─── Desktop table row (ranks 4-50) ────────────────────────────────

function RankRow({
  rank,
  row,
  dailyGoal,
}: {
  rank: number;
  row: LeaderboardRow;
  dailyGoal: number;
}) {
  return (
    <tr className="border-b border-border-soft last:border-0 hover:bg-bg-elevated/40 transition-colors">
      <td className="py-3 px-4 font-mono text-sm font-bold text-text-muted tabular-nums">
        {rank}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={row.publicName} url={row.publicPhotoUrl} size={32} />
          <div className="font-medium text-sm truncate">{row.publicName}</div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-text-muted">{row.city}</td>
      <td className="py-3 px-4 text-xs font-mono tabular-nums">
        {row.daysHitGoal} / {row.daysElapsed}
      </td>
      <td className="py-3 px-4 text-xs font-mono tabular-nums">
        {row.totalSteps.toLocaleString('en-IN')}
      </td>
      <td className="py-3 px-4 text-xs font-mono tabular-nums">
        {row.currentStreak} {row.currentStreak === 1 ? 'day' : 'days'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden max-w-[80px]">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${Math.min(row.consistencyPct, 100)}%` }}
              aria-label={`${row.consistencyPct.toFixed(0)}% consistency against ${dailyGoal.toLocaleString('en-IN')} steps`}
            />
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-accent">
            {row.consistencyPct.toFixed(0)}%
          </span>
        </div>
      </td>
    </tr>
  );
}

// ─── Mobile card row (ranks 4-50) ──────────────────────────────────

function RankCardMobile({
  rank,
  row,
  dailyGoal,
}: {
  rank: number;
  row: LeaderboardRow;
  dailyGoal: number;
}) {
  return (
    <div className="rounded-xl bg-bg-card border border-border-soft p-4">
      <div className="flex items-center gap-3">
        <span
          className="font-mono font-bold text-text-muted tabular-nums shrink-0"
          style={{ fontSize: 15, minWidth: 26 }}
        >
          {rank}
        </span>
        <Avatar name={row.publicName} url={row.publicPhotoUrl} size={40} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{row.publicName}</div>
          <div className="text-[11px] text-text-muted truncate">{row.city}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-base font-bold tabular-nums text-accent">
            {row.consistencyPct.toFixed(0)}%
          </div>
          <div className="text-[10px] text-text-dim font-mono uppercase tracking-[0.12em]">
            Consistency
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-text-muted">
        <span className="inline-flex items-center gap-1">
          <Trophy size={10} className="text-accent" />
          {row.daysHitGoal} / {row.daysElapsed} hit
        </span>
        <span className="text-border-soft">·</span>
        <span className="inline-flex items-center gap-1">
          <Flame size={10} className="text-accent" />
          {row.currentStreak} streak
        </span>
        <span className="text-border-soft">·</span>
        <span className="inline-flex items-center gap-1">
          <Footprints size={10} className="text-accent" />
          {formatStepsCompact(row.totalSteps)}
        </span>
      </div>
      <div className="text-[10px] text-text-dim mt-2 font-mono">
        Goal: {dailyGoal.toLocaleString('en-IN')} steps / day
      </div>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────

function Avatar({
  name,
  url,
  size,
}: {
  name: string;
  url: string | null;
  size: number;
}) {
  if (url) {
    return (
      <div
        className="relative rounded-full overflow-hidden bg-bg-elevated flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="rounded-full bg-bg-elevated flex items-center justify-center font-mono font-bold text-text-muted flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ─── Formatting helpers ────────────────────────────────────────────

// ─── Empty state (no participants yet) ────────────────────────────

function EmptyState() {
  // Three preview-card slots that hint at what the podium will look
  // like once mothers register. Visually identical to the real
  // PodiumCard, but with placeholder values + a soft veil + a single
  // 'Be the first' overlay above the leftmost (gold) slot.
  const placeholders = [
    {
      rank: 1,
      label: 'GOLD',
      border: 'border-accent/40',
      bg: 'bg-accent/5',
      text: 'text-accent',
    },
    {
      rank: 2,
      label: 'SILVER',
      border: 'border-text-muted/30',
      bg: 'bg-bg-elevated/50',
      text: 'text-text',
    },
    {
      rank: 3,
      label: 'BRONZE',
      border: 'border-amber/30',
      bg: 'bg-amber/5',
      text: 'text-amber',
    },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Hero call-out */}
      <div className="rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/15 via-bg-card to-bg-card p-6 md:p-10 lg:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 text-accent mb-5">
          <Sparkles size={28} />
        </div>
        <h2 className="font-display font-semibold text-2xl md:text-3xl lg:text-4xl tracking-tight leading-tight mb-3">
          The board is waiting for its first name.
        </h2>
        <p
          className="text-text-muted leading-relaxed max-w-xl mx-auto mb-6"
          style={{ fontSize: 17 }}
        >
          Sixty days. Ten thousand steps a day. One witnessed cohort. The
          first mother to register sits at the top until day two — and the
          team starts logging her steps the moment she joins.
        </p>
        <Link
          href="/mother-strong"
          className="inline-flex items-center justify-center gap-2 px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
          style={{ height: 52, minHeight: 52, fontSize: 16 }}
        >
          Be the first
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Preview of what the podium will look like */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-4 text-center">
          Once mothers join, the podium fills in like this
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {placeholders.map((p) => (
            <div
              key={p.rank}
              className={`relative rounded-2xl border ${p.border} ${p.bg} p-5 md:p-6 opacity-60`}
              aria-hidden
            >
              {/* Rank badge */}
              <div className="absolute -top-3 -left-3 w-11 h-11 rounded-full bg-bg-card border border-border-soft flex items-center justify-center">
                <span
                  className={`font-display font-bold ${p.text}`}
                  style={{ fontSize: 22 }}
                >
                  {p.rank}
                </span>
              </div>
              <div
                className={`absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.18em] font-bold ${p.text}`}
              >
                {p.label}
              </div>

              {/* Avatar + name skeleton */}
              <div className="flex items-center gap-3 mt-3">
                <div className="w-14 h-14 rounded-full bg-bg-elevated/80 border border-border-soft flex items-center justify-center text-text-dim">
                  <Trophy size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-32 rounded-full bg-bg-elevated/80 mb-2" />
                  <div className="h-2.5 w-20 rounded-full bg-bg-elevated/60" />
                </div>
              </div>

              {/* Stat skeleton */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {['Days hit', 'Streak', 'Total'].map((s) => (
                  <div
                    key={s}
                    className="rounded-lg bg-bg-card/60 border border-border-soft px-2 py-2 text-center"
                  >
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted font-bold mb-0.5">
                      {s}
                    </div>
                    <div className="h-4 mx-auto w-8 rounded-full bg-bg-elevated/70" />
                  </div>
                ))}
              </div>

              {/* Consistency placeholder */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
                    Consistency
                  </span>
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${p.text}`}
                  >
                    —
                  </span>
                </div>
                <div className="relative h-1.5 bg-bg-elevated rounded-full overflow-hidden" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What to expect block */}
      <div className="rounded-2xl border border-border bg-bg-card p-5 md:p-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-3">
          What happens when you register
        </div>
        <ol className="space-y-3 text-sm text-text-muted leading-relaxed">
          <Step
            n="1"
            text="The team adds you to the cohort's WhatsApp group within hours."
          />
          <Step
            n="2"
            text="Your daily steps are logged for you. No app to install."
          />
          <Step
            n="3"
            text="Your name appears here on the public board — ranked by consistency."
          />
          <Step
            n="4"
            text="On Day 60, you receive a personal gratitude card with your numbers."
          />
        </ol>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 text-accent font-mono text-[11px] font-bold">
        {n}
      </span>
      <span className="min-w-0 text-text">{text}</span>
    </li>
  );
}

function formatStepsCompact(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}
