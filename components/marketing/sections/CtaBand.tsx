import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { AmbientVideo } from '@/components/shared/AmbientVideo';
import { CTA_BACKGROUND_VIDEO } from '@/lib/videos';

export function CtaBand() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Optional ambient video backdrop */}
      {CTA_BACKGROUND_VIDEO && (
        <div className="absolute inset-0 pointer-events-none">
          <AmbientVideo
            src={CTA_BACKGROUND_VIDEO.src}
            poster={CTA_BACKGROUND_VIDEO.poster}
            opacity={CTA_BACKGROUND_VIDEO.opacity ?? 0.15}
            playbackRate={CTA_BACKGROUND_VIDEO.playbackRate ?? 0.5}
            objectPosition={CTA_BACKGROUND_VIDEO.objectPosition}
            desktopOnly
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(10,12,9,0.7), rgba(10,12,9,0.92))',
            }}
          />
        </div>
      )}

      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(198,255,61,0.15), transparent 60%),
            linear-gradient(180deg, #0a0c09 0%, #101510 50%, #0a0c09 100%)
          `,
          opacity: CTA_BACKGROUND_VIDEO ? 0.6 : 1,
        }}
      />

      <div className="container-safe relative text-center">
        <span className="eyebrow">Ready when you are</span>
        <h2 className="mt-4 font-display font-semibold text-display-lg md:text-display-xl tracking-tight max-w-3xl mx-auto leading-[1.05]">
          Your transformation starts with{' '}
          <span className="text-accent">one conversation.</span>
        </h2>
        <p className="mt-5 md:mt-6 text-base md:text-lg text-text-muted max-w-xl mx-auto leading-relaxed">
          Book a free 30-minute discovery call. No pressure. No commitment. Just a clear conversation about your goals and the right path forward.
        </p>
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link href="/book">
            <Button size="lg" className="w-full sm:w-auto min-w-[220px]">
              Book Free Discovery Call
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="/experts">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore the Team
            </Button>
          </Link>
        </div>

        <div className="mt-12 md:mt-16 flex items-center justify-center gap-8 md:gap-12 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              No Credit Card Required
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Free 30-Min Call
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Hyderabad · London · Online
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
