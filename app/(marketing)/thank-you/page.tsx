import Link from 'next/link';
import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { whatsappLink } from '@/lib/constants';

interface ThankYouPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { ref } = await searchParams;

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 pb-20">
      <div className="container-safe text-center max-w-xl">
        <div
          className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-accent/10 border border-accent/30 mb-8"
          style={{ boxShadow: '0 0 60px rgba(198,255,61,0.15)' }}
        >
          <Check size={36} strokeWidth={3} className="text-accent" />
        </div>

        <span className="eyebrow-accent">Booking Received</span>
        <h1 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
          We&rsquo;ll be in touch within <span className="text-accent">24 hours.</span>
        </h1>

        {ref && (
          <div className="mt-8 inline-block p-4 rounded-lg bg-bg-card border border-border">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium mb-1">
              Booking Reference
            </div>
            <div className="font-mono text-lg font-bold text-accent">
              {ref}
            </div>
          </div>
        )}

        <p className="mt-8 text-base text-text-muted leading-relaxed">
          You&rsquo;ll receive a confirmation on WhatsApp shortly. In the meantime, feel free to message us directly with any questions.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={whatsappLink(
              ref
                ? `Hi PURE X, I just submitted booking ${ref}. Wanted to check...`
                : 'Hi PURE X, I just submitted a booking.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#25D366] text-white font-medium text-sm hover:scale-[1.02] transition-transform"
          >
            <MessageCircle size={16} fill="currentColor" />
            Message on WhatsApp
          </a>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <div className="mt-16 pt-10 border-t border-border">
          <div className="eyebrow mb-6">While You Wait</div>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            <Link
              href="/transformations"
              className="p-4 rounded-lg bg-bg-card border border-border hover:border-accent/40 transition-colors group"
            >
              <div className="font-display font-semibold text-sm group-hover:text-accent transition-colors">
                See Transformations
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Real clients, real results
              </div>
            </Link>
            <Link
              href="/experts"
              className="p-4 rounded-lg bg-bg-card border border-border hover:border-accent/40 transition-colors group"
            >
              <div className="font-display font-semibold text-sm group-hover:text-accent transition-colors">
                Meet the Team
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Six specialists, one plan
              </div>
            </Link>
            <Link
              href="/faq"
              className="p-4 rounded-lg bg-bg-card border border-border hover:border-accent/40 transition-colors group"
            >
              <div className="font-display font-semibold text-sm group-hover:text-accent transition-colors">
                FAQ
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Common questions
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
