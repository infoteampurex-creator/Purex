import Link from 'next/link';
import { ArrowUpRight, Waves, Bike, Footprints } from 'lucide-react';
import { AmbientVideo } from '@/components/shared/AmbientVideo';
import { IRONMAN_SECTION_VIDEO } from '@/lib/videos';

const disciplines = [
  {
    icon: Waves,
    name: 'Swim',
    distance: '3.8',
    unit: 'km',
    label: 'Open water',
    focus: 'Technique-first. Bilateral breathing. Shoulder stability. Open-water acclimation before race day.',
  },
  {
    icon: Bike,
    name: 'Bike',
    distance: '180',
    unit: 'km',
    label: 'Road cycling',
    focus: 'Power zones. 85–95rpm cadence. Fat-adaptation for long efforts. On-bike nutrition practiced weekly.',
  },
  {
    icon: Footprints,
    name: 'Run',
    distance: '42.2',
    unit: 'km',
    label: 'Full marathon',
    focus: 'Brick training (bike-to-run). Glycogen management. Pace discipline. Running on tired legs is a learned skill.',
  },
];

const phases = [
  { num: '01', name: 'Base', weeks: 'Weeks 1–8', desc: 'Aerobic engine across all three sports. Zone 2 dominant. Volume build, low intensity.', active: true },
  { num: '02', name: 'Build', weeks: 'Weeks 9–16', desc: 'Threshold work introduced. First brick sessions. Race nutrition strategy tested.' },
  { num: '03', name: 'Specificity', weeks: 'Weeks 17–22', desc: 'Half-race simulations. Time trials in each discipline. Mental endurance sessions.' },
  { num: '04', name: 'Peak & Taper', weeks: 'Weeks 23–24+', desc: 'Volume down, intensity held. Race logistics. Sleep, nutrition, mental prep locked in.' },
  { num: 'RD', name: 'Race Day', weeks: '17-hour cut-off', desc: 'Execute the plan. Coach on call. Post-race physio + medical check-in built into the programme.' },
];

export function IronmanSection() {
  return (
    <section id="ironman" className="py-20 md:py-28 bg-bg-inset relative overflow-hidden">
      {/* Optional ambient video backdrop */}
      {IRONMAN_SECTION_VIDEO && (
        <div className="absolute inset-0 pointer-events-none">
          <AmbientVideo
            src={IRONMAN_SECTION_VIDEO.src}
            poster={IRONMAN_SECTION_VIDEO.poster}
            opacity={IRONMAN_SECTION_VIDEO.opacity ?? 0.18}
            playbackRate={IRONMAN_SECTION_VIDEO.playbackRate ?? 0.8}
            objectPosition={IRONMAN_SECTION_VIDEO.objectPosition}
            desktopOnly
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(14,18,13,0.85) 0%, rgba(14,18,13,0.65) 50%, rgba(14,18,13,0.92) 100%)',
            }}
          />
        </div>
      )}

      {/* Atmospheric accent */}
      <div
        className="absolute -left-40 bottom-0 w-[500px] h-[500px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(77, 255, 184, 0.10), transparent 60%)',
        }}
      />

      <div className="container-safe relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <span className="eyebrow">Elite Endurance</span>
            <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
              IRONMAN: Three sports.{' '}
              <span className="text-accent">One extraordinary day.</span>
            </h2>
            <p className="mt-4 text-base text-text-muted leading-relaxed">
              A 3.8km swim, a 180km bike, a 42.2km marathon. The most demanding single-day athletic event on earth. With medical oversight and smart periodization, it&rsquo;s more accessible than you think.
            </p>
          </div>
          <Link
            href="/book?expert=paula-konasionok"
            className="inline-flex items-center gap-2 text-sm text-text hover:text-accent transition-colors font-medium flex-shrink-0"
          >
            Book IRONMAN Consult
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Main training card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent text-bg px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.14em] font-bold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-bg" />
                Medically-Supervised Endurance
              </div>
              <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight">
                The Triathlon <span className="text-accent">Three-Discipline</span> Build
              </h3>
              <p className="mt-3 text-sm md:text-base text-text-muted max-w-xl leading-relaxed">
                We make IRONMAN finishable for working adults with 10–12 training hours a week. Dr. Chandralekha monitors cardiovascular markers throughout. Krishna prevents the overuse injuries that derail most self-coached athletes.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <MetaChip num="24+" label="Weeks (70.3)" />
              <MetaChip num="36+" label="Weeks (Full)" />
              <MetaChip num="3" label="Disciplines" />
            </div>
          </div>

          {/* Disciplines grid */}
          <div className="mb-10">
            <div className="grid md:grid-cols-3 gap-4">
              {disciplines.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.name}
                    className="p-5 md:p-6 rounded-xl bg-bg-elevated border border-border hover:border-accent transition-all hover:-translate-y-0.5 duration-300"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center">
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div className="font-display font-bold text-xl tracking-tight">
                        {d.name}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-display font-bold text-4xl text-accent tracking-tight leading-none">
                        {d.distance}
                      </span>
                      <span className="font-display font-semibold text-xl text-accent">
                        {d.unit}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium mb-4">
                      {d.label}
                    </div>
                    <div className="text-sm text-text leading-relaxed pt-4 border-t border-border-soft">
                      {d.focus}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phases timeline */}
          <div>
            <div className="eyebrow mb-5">Four-Phase IRONMAN Build</div>
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
                    {p.num === 'RD' ? 'Race Day' : `Phase ${p.num}`}
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
