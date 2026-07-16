import type { Metadata } from 'next';
import { Sparkles, Shield, Clock, MessageCircle } from 'lucide-react';
import { EnquiryForm } from '@/components/marketing/EnquiryForm';
import { EnquirySidebar } from '@/components/marketing/EnquirySidebar';

export const metadata: Metadata = {
  title: 'Apply · Team Purex',
  description:
    'Apply to coach with Team Purex. Premium hybrid athlete coaching — fat loss, muscle, athletic performance, hybrid fitness. Serious-intent only.',
};

export default function ApplyPage() {
  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Atmospheric backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% -10%, rgba(198, 255, 61, 0.16) 0%, transparent 50%), radial-gradient(ellipse at 90% 30%, rgba(255, 184, 120, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-24 md:pt-28 pb-16">
        {/* Hero */}
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            Team Purex
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-5">
            Apply to coach with us.
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-2xl"
            style={{ fontSize: 18 }}
          >
            We&apos;re a small team of five specialists building sustainable
            transformations through structured nutrition, intelligent
            training, and real accountability. Tell us about you — we&apos;ll
            reach out personally within 24 hours.
          </p>

          {/* Trust pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <TrustPill icon={<Clock size={12} />} label="24h response" />
            <TrustPill icon={<MessageCircle size={12} />} label="Direct WhatsApp follow-up" />
            <TrustPill icon={<Shield size={12} />} label="Private, no spam" />
            <TrustPill icon={<Sparkles size={12} />} label="Serious enquiries only" />
          </div>
        </header>

        {/* Form + sidebar — 2-column desktop, stacked mobile (sidebar first) */}
        <div className="mt-12 md:mt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 md:gap-10 lg:gap-12">
          <div className="order-2 lg:order-1 min-w-0">
            <EnquiryForm />
          </div>
          <div className="order-1 lg:order-2">
            <EnquirySidebar />
          </div>
        </div>
      </div>
    </main>
  );
}

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card/80 border border-border-soft text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted font-bold">
      <span className="text-accent">{icon}</span>
      {label}
    </span>
  );
}
