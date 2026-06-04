import type { Metadata } from 'next';
import { Sparkles, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import { ApplicationForm } from '@/components/marketing/ApplicationForm';

export const metadata: Metadata = {
  title: 'Transformation Application · TEAM PURE X',
  description:
    'Detailed transformation application form for qualified leads. Help us build a plan specifically for you.',
  robots: { index: false, follow: false }, // not for public discovery
};

interface PageProps {
  searchParams: Promise<{ ref?: string; email?: string }>;
}

export default async function ApplicationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const enquiryId =
    params.ref && /^[0-9a-f-]{36}$/i.test(params.ref) ? params.ref : null;
  const prefillEmail =
    typeof params.email === 'string' ? params.email : undefined;

  return (
    <main className="relative bg-bg text-text min-h-screen">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% -10%, rgba(198, 255, 61, 0.14) 0%, transparent 50%), radial-gradient(ellipse at 90% 30%, rgba(255, 184, 120, 0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-24 md:pt-28 pb-16 max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            TEAM PURE X
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight leading-[1.05] mb-4">
            Transformation Application.
          </h1>
          <p
            className="text-text-muted leading-relaxed"
            style={{ fontSize: 17 }}
          >
            We focus on building sustainable transformations through
            structured nutrition, intelligent training, accountability,
            and performance-based coaching. Please fill this carefully — it
            helps us create a plan specifically for you.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Pill icon={<Clock size={11} />} label="~7 minutes" />
            <Pill icon={<ShieldCheck size={11} />} label="Auto-saved as you type" />
            <Pill icon={<MessageCircle size={11} />} label="Coach response in 48h" />
            <Pill icon={<Sparkles size={11} />} label="Private — coach-only" />
          </div>
        </header>

        <ApplicationForm enquiryId={enquiryId} prefillEmail={prefillEmail} />
      </div>
    </main>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-card/80 border border-border-soft text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted font-bold">
      <span className="text-accent">{icon}</span>
      {label}
    </span>
  );
}
