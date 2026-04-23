import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AmbientVideo } from '@/components/shared/AmbientVideo';
import { HYROX_SECTION_VIDEO } from '@/lib/videos';

const stations = [
  { num: '01', name: 'SkiErg', desc: '1,000m pull endurance. Lats, core, cardio.' },
  { num: '02', name: 'Sled Push', desc: '50m loaded sprint. Quads, glutes, explosive power.' },
  { num: '03', name: 'Sled Pull', desc: '50m rope pull. Hamstrings, back, grip.' },
  { num: '04', name: 'Burpee Broad Jump', desc: '80m continuous. Full-body coordination.' },
  { num: '05', name: 'Rowing', desc: '1,000m ergometer. Total-body endurance.' },
  { num: '06', name: 'Farmers Carry', desc: '200m loaded carry. Grip, posture, core stability.' },
  { num: '07', name: 'Sandbag Lunges', desc: '100m walking lunges. Legs + balance under load.' },
  { num: '08', name: 'Wall Balls', desc: '100 reps. Finisher of the race. Squat + throw combo.' },
];

const phases = [
  { num: '01', name: 'Foundations', weeks: 'Weeks 1–4', desc: 'Movement competency. Zone 2 base. Technique on every station. Injury-free start.', active: true },
  { num: '02', name: 'Strength', weeks: 'Weeks 5–8', desc: 'Progressive overload on sled, SkiErg, rower. Race-pace intervals introduced.' },
  { num: '03', name: 'Endurance', weeks: 'Weeks 9–12', desc: 'Mini race simulations. Lactate threshold work. Strength + running fused.' },
  { num: '04', name: 'Specificity', weeks: 'Weeks 13–15', desc: 'Full simulations. Transition drills. Nutrition and hydration race-day strategy.' },
  { num: '05', name: 'Peak & Taper', weeks: 'Week 16', desc: 'Recovery-led. Minimal volume, maximum freshness. Mental race prep.' },
];

export function HyroxSection() {
  return (
    <section id="hyrox" className="py-20 md:py-28 relative overflow-hidden">
      {/* Optional ambient video backdrop */}
      {HYROX_SECTION_VIDEO && (
        <div className="absolute inset-0 pointer-events-none">
          <AmbientVideo
            src={HYROX_SECTION_VIDEO.src}
            poster={HYROX_SECTION_VIDEO.poster}
            opacity={HYROX_SECTION_VIDEO.opacity ?? 0.18}
            playbackRate={HYROX_SECTION_VIDEO.playbackRate ?? 0.8}
            objectPosition={HYROX_SECTION_VIDEO.objectPosition}
            desktopOnly
          />
          {/* Dark overlay for readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(10,12,9,0.8) 0%, rgba(10,12,9,0.6) 50%, rgba(10,12,9,0.9) 100%)',
            }}
          />
        </div>
      )}

      {/* Atmospheric accent */}
      <div
        className="absolute -right-40 top-0 w-[500px] h-[500px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(198, 255, 61, 0.12), transparent 60%)',
        }}
      />

      <div className="container-safe relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <span className="eyebrow">Flagship Discipline</span>
            <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
              HYROX: Eight stations.{' '}
              <span className="text-accent">One complete athlete.</span>
            </h2>
            <p className="mt-4 text-base text-text-muted leading-relaxed">
              The world&rsquo;s fastest-growing fitness race. 8 km of running + 8 functional stations. We train you for the race — or train you <em className="text-text not-italic font-medium">with HYROX methodology</em> even if you never step on a start line.
            </p>
          </div>
          <Link
            href="/book?expert=siva-reddy"
            className="inline-flex items-center gap-2 text-sm text-text hover:text-accent transition-colors font-medium flex-shrink-0"
          >
            Book HYROX Assessment
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Main training card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent text-bg px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.14em] font-bold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-bg" />
                HYROX Certified Coaching
              </div>
              <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight">
                The 16-Week <span className="text-accent">HYROX Cycle</span>
              </h3>
              <p className="mt-3 text-sm md:text-base text-text-muted max-w-xl leading-relaxed">
                A periodized programme that builds every physical quality HYROX demands — strength, endurance, power, and mental resilience — in the exact sequence your body needs them.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <MetaChip num="16" label="Weeks" />
              <MetaChip num="5" label="Phases" />
              <MetaChip num="8" label="Stations" />
            </div>
          </div>

          {/* Stations grid */}
          <div className="mb-10">
            <div className="eyebrow mb-5">The Eight Race Stations</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stations.map((s) => (
                <div
                  key={s.num}
                  className="p-4 md:p-5 rounded-xl bg-bg-elevated border border-border hover:border-accent transition-all hover:-translate-y-0.5 duration-300"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold">
                    Station {s.num}
                  </div>
                  <div className="mt-2 font-display font-semibold text-base md:text-lg tracking-tight leading-tight">
                    {s.name}
                  </div>
                  <div className="mt-1.5 text-xs text-text-muted leading-relaxed">
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phases timeline */}
          <div>
            <div className="eyebrow mb-5">Five-Phase Periodization</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {phases.map((p) => (
                <div
                  key={p.num}
                  className={`p-4 rounded-xl border transition-all ${
                    p.active
                      ? 'bg-gradient-to-br from-accent/[0.15] to-accent/[0.03] border-accent'
                      : 'bg-bg-elevated border-border'
                  }`}
                >
                  <div
                    className={`font-mono text-[9px] uppercase tracking-[0.15em] font-medium mb-2 ${
                      p.active ? 'text-accent' : 'text-text-muted'
                    }`}
                  >
                    Phase {p.num}
                  </div>
                  <div className="font-display font-semibold text-base tracking-tight">
                    {p.name}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted font-medium">
                    {p.weeks}
                  </div>
                  <div className="mt-3 text-xs text-text-muted leading-relaxed">
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaChip({ num, label }: { num: string; label: string }) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl px-4 py-3 min-w-[100px]">
      <div className="font-display font-bold text-2xl text-accent tracking-tight leading-none">
        {num}
      </div>
      <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted font-medium">
        {label}
      </div>
    </div>
  );
}
