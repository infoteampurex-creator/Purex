import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Trophy } from 'lucide-react';
import {
  getMotherStrongConfig,
  getMotherStrongActiveCount,
  getCurrentChallengeDay,
} from '@/lib/data/mother-strong';
import { ms } from '@/lib/i18n/mother-strong';
import { RegistrationForm } from '@/components/mother-strong/RegistrationForm';
import { type PreferredLanguage } from '@/lib/data/mother-strong-types';

export const metadata: Metadata = {
  title: 'PUREX Mother Strong — Mother\'s Day 60-day walking cohort',
  description:
    "Free 60-day walking program for mothers. 10,000 steps a day, witnessed by the team. Register in two minutes.",
};

interface PageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function MotherStrongLandingPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const lang: PreferredLanguage = params.lang === 'hi' ? 'hi' : 'en';
  const t = ms(lang);

  const [config, activeCount, day] = await Promise.all([
    getMotherStrongConfig(),
    getMotherStrongActiveCount(),
    getCurrentChallengeDay(),
  ]);

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere — soft accent halo top-centre */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-24 md:pt-28 pb-16">
        {/* Lang toggle */}
        <div className="absolute top-24 right-6 md:top-28 md:right-12 flex items-center gap-1 text-[12px] font-mono uppercase tracking-[0.16em] font-bold">
          <LangLink current={lang} value="en" label="English" />
          <span className="text-text-dim mx-1">·</span>
          <LangLink current={lang} value="hi" label="हिंदी" />
        </div>

        {/* Hero */}
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            {t.brand.name}
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-5">
            {t.register.title}
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-2xl"
            style={{ fontSize: 18 }}
          >
            {t.register.subtitle}
          </p>

          {/* Live cohort stats */}
          {activeCount > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-4 md:gap-6">
              {day > 0 && (
                <Stat icon={<Trophy size={14} />} label={`Day ${day} of 60`} />
              )}
              <Stat
                icon={<Users size={14} />}
                label={`${activeCount} ${activeCount === 1 ? 'mother' : 'mothers'} walking strong`}
              />
              <Link
                href="/mother-strong/leaderboard"
                className="font-mono text-[12px] uppercase tracking-[0.16em] text-accent hover:underline font-bold"
                style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
              >
                See the leaderboard →
              </Link>
            </div>
          )}
        </header>

        {/* Registration form */}
        <div className="mt-12 md:mt-14 max-w-2xl">
          <RegistrationForm lang={lang} whatsappGroupLink={config.whatsappGroupLink} />
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border-soft text-xs font-mono uppercase tracking-[0.14em] text-text-muted font-bold">
      <span className="text-accent">{icon}</span>
      {label}
    </span>
  );
}

function LangLink({
  current,
  value,
  label,
}: {
  current: PreferredLanguage;
  value: PreferredLanguage;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={`/mother-strong?lang=${value}`}
      className={
        active
          ? 'text-accent'
          : 'text-text-muted hover:text-text transition-colors'
      }
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
