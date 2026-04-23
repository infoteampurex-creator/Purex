import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Expert } from '@/lib/constants';

/**
 * Each expert has a photoUrl in lib/constants.ts. Drop matching files in
 * /public/experts/ (e.g. /public/experts/siva-reddy.jpg) and they auto-load.
 * When no file is present, renders the branded gradient portrait fallback.
 *
 * Layout: photo fills the entire card. Text overlays at the bottom with a
 * dark gradient for readability — matches the Siva hero card style.
 */
export function ExpertCard({ expert }: { expert: Expert }) {
  const initials = expert.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  const paletteMap: Record<string, { bg: string; skin: string; torso: string }> = {
    'siva-reddy':       { bg: '#2a3a1a', skin: '#b8a080', torso: '#1a1f14' },
    'chandralekha':     { bg: '#2a2420', skin: '#d8b898', torso: '#4a4a48' },
    'krishna':          { bg: '#251f18', skin: '#a8785a', torso: '#1a1a16' },
    'paula-konasionok': { bg: '#3a2820', skin: '#d8a888', torso: '#8a3a2a' },
    'amber-jasari':     { bg: '#1a2030', skin: '#e8c8a8', torso: '#2a3a5a' },
    'siva-jampana':     { bg: '#1f1f1f', skin: '#c89880', torso: '#14141a' },
  };
  const palette = paletteMap[expert.slug] ?? paletteMap['siva-reddy'];

  return (
    <Link
      href={`/experts/${expert.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-bg-card border border-border hover:border-accent/50 transition-all duration-500 hover:-translate-y-1"
      style={{ aspectRatio: '4/5' }}
    >
      {/* ═══ LAYER 1 — Photo fills entire card ═══ */}
      <div className="absolute inset-0 overflow-hidden bg-bg-elevated">
        {expert.photoUrl ? (
          <Image
            src={expert.photoUrl}
            alt={expert.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover object-[center_top] transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${palette.bg} 0%, #0f1410 60%, #0a0c09 100%)`,
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[130%]"
              style={{
                height: '50%',
                borderRadius: '50% 50% 0 0 / 40% 40% 0 0',
                background: `linear-gradient(180deg, ${palette.torso} 0%, #0a0c09 70%)`,
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: '38%',
                transform: 'translate(-50%, -50%)',
                width: '45%',
                aspectRatio: '1',
                background: `radial-gradient(circle at 50% 40%, ${palette.skin} 0%, ${palette.torso} 70%, #1a1614 100%)`,
                boxShadow:
                  'inset -8px -10px 20px rgba(0,0,0,0.5), inset 6px 6px 12px rgba(255,240,220,0.08)',
              }}
            />
            <div className="absolute bottom-[42%] left-1/2 -translate-x-1/2 z-10">
              <span className="font-display font-black text-5xl text-white/95 leading-none tracking-tight drop-shadow-lg">
                {initials}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ LAYER 2 — Dark gradient overlay for text readability ═══ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,12,9,0.05) 0%, transparent 35%, rgba(10,12,9,0.4) 70%, rgba(10,12,9,0.92) 100%)',
        }}
      />

      {/* ═══ LAYER 3 — Role tag (top-right) ═══ */}
      <div className="absolute top-3.5 right-3.5 z-10">
        <span className="inline-flex items-center bg-bg/70 backdrop-blur-xl border border-accent/40 text-accent px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
          {expert.shortRole}
        </span>
      </div>

      {/* ═══ LAYER 4 — Name + title only (bottom overlay) ═══ */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 z-10">
        <h3
          className="font-display font-semibold text-lg md:text-xl tracking-tight leading-tight text-white"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
        >
          {expert.name}
        </h3>
        <p
          className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/75 font-medium"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
        >
          {expert.title}
        </p>

        {/* Arrow button — sits alone, no stat crowding it */}
        <div className="flex justify-end mt-3 pt-3 border-t border-white/10">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-bg/40 backdrop-blur-md border border-white/20 text-white/80 group-hover:bg-accent group-hover:border-accent group-hover:text-bg transition-all">
            <ArrowUpRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}
