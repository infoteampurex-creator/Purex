'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, HelpCircle } from 'lucide-react';
import { FALLBACK_FAQS } from '@/lib/constants';
import { cn } from '@/lib/cn';

const CATEGORIES = ['All', 'Booking', 'Pricing', 'Training', 'Medical', 'HYROX'] as const;

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    if (activeCategory === 'All') return FALLBACK_FAQS;
    return FALLBACK_FAQS.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="relative bg-bg text-text">
      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
          }}
        />
        <div className="container-safe relative text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <HelpCircle size={13} />
            Questions, answered
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-5 max-w-2xl mx-auto">
            Before you <span className="text-accent">commit</span>,
            <br />
            everything you need to know.
          </h1>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            If your question isn't here, ask on the discovery call — we'll answer
            everything honestly.
          </p>
        </div>
      </section>

      {/* Category filter + FAQ list */}
      <section className="relative py-12 md:py-16">
        <div className="container-safe max-w-3xl">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8 md:mb-10 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(0);
                }}
                className={cn(
                  'px-4 h-9 rounded-full text-xs font-mono uppercase tracking-[0.12em] font-bold transition-colors',
                  activeCategory === cat
                    ? 'bg-accent text-bg'
                    : 'bg-bg-card border border-border-soft text-text-muted hover:text-text hover:border-accent/30'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={`${activeCategory}-${i}`}
                  className="rounded-2xl bg-bg-card border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-bg/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent font-bold mb-1.5">
                        {faq.category}
                      </div>
                      <div className="font-display font-semibold text-base md:text-lg leading-tight">
                        {faq.question}
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'text-text-muted flex-shrink-0 transition-transform duration-300',
                        isOpen && 'rotate-180 text-accent'
                      )}
                    />
                  </button>

                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-text-muted leading-relaxed border-t border-border-soft pt-4">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              No questions in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* Still have questions CTA */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe">
          <div className="rounded-3xl bg-bg-card border border-accent/30 p-8 md:p-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.12) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="font-display font-semibold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-4 max-w-xl mx-auto">
                Still have questions?
              </h3>
              <p className="text-text-muted mb-8 max-w-md mx-auto">
                A 20-minute discovery call covers it all. No hard sells.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
