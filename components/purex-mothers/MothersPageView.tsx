'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  Sparkles,
  Download,
  Share2,
  Trophy,
  Calendar,
  Dumbbell,
  Apple,
  Footprints,
  Crown,
  Heart,
  Move,
  ChevronRight,
  UserCircle,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  PUREX_MOTHERS,
  PUREX_MOTHERS_META,
  CATEGORY_META,
  type PureXMother,
} from '@/lib/data/purex-mothers';
import { AppreciationCard } from './AppreciationCard';

interface Props {
  /** Preselected via /purex-mothers/[slug] route. When null, the page
   *  shows a landing view (hero + stats + wall + message) without any
   *  card generator — each mother must open her own personal link. */
  initialMother: PureXMother | null;
}

type Aspect = 'portrait' | 'square';

// ─── Palette ─────────────────────────────────────────────────
// Page skeleton uses the PureX gold aesthetic (matches the rest of
// the site — mother-strong, dashboard hero, etc). Pink/rose-gold is
// reserved for the CELEBRATION moments: the card itself, the photo
// upload/generate step, the reveal card. That contrast is what makes
// the emotional payoff land.
const GOLD_LIGHT = '#fbe6a3';
const GOLD = '#ffd24d';
const GOLD_DEEP = '#b88d2c';
const ROSE = '#e8b298';

export function MothersPageView({ initialMother }: Props) {
  return (
    <main
      className="relative min-h-screen"
      style={{ background: '#0a0c09', color: '#f5f5f0' }}
    >
      <BackgroundAtmosphere />

      <div className="relative container-safe max-w-5xl mx-auto px-4 pt-20 pb-24">
        <HeroSection mother={initialMother} />
        <StatsSection />

        {initialMother ? (
          <PersonalGenerator mother={initialMother} />
        ) : (
          <MemberPickerSection />
        )}

        <AppreciationWallSection />
        <GroupMessageSection />
        <CTASection />
      </div>
    </main>
  );
}

// ─── Background atmosphere ──────────────────────────────────────

function BackgroundAtmosphere() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(255,210,77,0.10) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 40%, rgba(255,184,120,0.08) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 100%, rgba(184,141,44,0.06) 0%, transparent 55%)
        `,
      }}
    />
  );
}

// ─── Personal Generator (only shown on /purex-mothers/[slug]) ────

function PersonalGenerator({ mother }: { mother: PureXMother }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [aspect, setAspect] = useState<Aspect>('portrait');
  const [revealed, setRevealed] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  // Editable full name — mother can add surname or refine spelling.
  // Defaults to her slug-derived name, but she owns the field.
  const [displayName, setDisplayName] = useState(mother.name);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const cardWidth = aspect === 'portrait' ? 1122 : 1080;
  const cardHeight = aspect === 'portrait' ? 1402 : 1080;

  // Auto-scale the on-screen preview to the container width
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(0.296);
  useEffect(() => {
    const update = () => {
      const c = previewWrapRef.current;
      if (!c) return;
      setPreviewScale(c.clientWidth / cardWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [cardWidth]);

  // ─── Photo upload ────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationMsg('Please upload an image file (JPG or PNG).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setValidationMsg('Photo is too large — please use a file under 8 MB.');
      return;
    }
    setValidationMsg(null);
    setRevealed(false);
    setGeneratedDataUrl(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUrl(e.target?.result as string);
      setOffset({ x: 0, y: 0 });
      setScale(1);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ─── Drag-to-position on preview ─────────────────────────────

  const onPointerDown = (e: React.PointerEvent) => {
    if (!photoUrl) return;
    dragging.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.startX;
    const dy = e.clientY - dragging.current.startY;
    setOffset({
      x: dragging.current.ox + dx / previewScale,
      y: dragging.current.oy + dy / previewScale,
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // ─── Generate (reveal + export) ───────────────────────────────

  const runConfetti = () => {
    // Rose-gold + pink burst
    confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 50,
      origin: { y: 0.4 },
      colors: ['#ff2f8f', '#e8b298', '#f8d4c1', '#ffd700', '#c11f6b', '#ffcbdd'],
      scalar: 1.15,
    });
    // Small follow-up burst 250ms later for depth
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        startVelocity: 35,
        origin: { y: 0.5 },
        colors: ['#ffd700', '#e8b298', '#ff2f8f'],
        scalar: 0.9,
      });
    }, 250);
  };

  const generate = async () => {
    if (!photoUrl) {
      setValidationMsg('Please upload your photo to generate the card.');
      return;
    }
    setValidationMsg(null);
    setGenerating(true);
    setRevealed(true);
    // Give React a frame to paint the reveal, then wait for Google
    // Fonts to finish loading — html-to-image renders whatever the
    // browser has NOW, so a font race would export in fallback.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // ignore — best-effort
    }
    runConfetti();
    try {
      if (!cardRef.current) throw new Error('Card node missing');
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: cardWidth,
        height: cardHeight,
      });
      setGeneratedDataUrl(dataUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[purex-mothers] export failed', err);
      setValidationMsg('Could not generate the card. Please try again.');
      setRevealed(false);
    } finally {
      setGenerating(false);
    }
  };

  const download = () => {
    if (!generatedDataUrl) return;
    const link = document.createElement('a');
    link.download = `team-purex-mothers-${mother.slug}-60-days-card.png`;
    link.href = generatedDataUrl;
    link.click();
  };

  const shareOnWhatsApp = async () => {
    if (!generatedDataUrl) return;
    const caption = `60 Days of PURE X Mothers Strength ✨\n${mother.name} — ${mother.title}\nTrainer: ${PUREX_MOTHERS_META.trainerName}`;
    try {
      const blob = await (await fetch(generatedDataUrl)).blob();
      const file = new File(
        [blob],
        `team-purex-mothers-${mother.slug}-60-days-card.png`,
        { type: 'image/png' }
      );
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: caption, title: caption });
        return;
      }
      // Desktop fallback: download + open WhatsApp Web
      download();
      const url = `https://wa.me/?text=${encodeURIComponent(caption + ' (Attach the card image you just downloaded.)')}`;
      window.open(url, '_blank');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[purex-mothers] share failed', err);
      setValidationMsg('Could not share. Try Download instead.');
    }
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <section id="generator" className="mt-16 scroll-mt-6">
      <SectionHeader
        kicker={revealed ? 'Your card is ready' : 'Almost there'}
        title={
          revealed
            ? `Congratulations, ${mother.name}`
            : `Upload your photo, ${mother.name}`
        }
        subtitle={
          revealed
            ? 'Save it to your phone or share it directly on WhatsApp.'
            : 'Your award title is hidden until you tap Generate — that is the surprise. ✨'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 mt-8">
        {/* ── Left panel: upload + generate ─────────────── */}
        <div className="space-y-4">
          {/* Full name input — allows surname / spelling tweaks */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: 'rgba(232,184,84,0.35)',
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(232,184,84,0.06), transparent 70%), rgba(255,255,255,0.02)',
            }}
          >
            <div
              className="font-mono uppercase tracking-[0.22em] font-bold mb-2"
              style={{ fontSize: 10, color: '#f5d78e' }}
            >
              Your name as it should appear on the card
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                // Editing the name after reveal invalidates the export
                if (revealed) {
                  setRevealed(false);
                  setGeneratedDataUrl(null);
                }
              }}
              maxLength={40}
              placeholder="e.g. Vani Sharma"
              className="w-full rounded-lg border px-3 py-2.5 font-display font-bold"
              style={{
                fontSize: 20,
                color: 'rgba(245,245,240,0.98)',
                fontStyle: 'italic',
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.10)',
              }}
            />
            <div
              className="font-mono mt-2"
              style={{
                fontSize: 10,
                color: 'rgba(245,215,142,0.55)',
              }}
            >
              Add your surname if you&apos;d like — up to 40 characters.
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="rounded-2xl border-2 border-dashed p-6 text-center relative"
            style={{
              borderColor: 'rgba(255,47,143,0.35)',
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(255,47,143,0.08), transparent 70%), rgba(255,255,255,0.02)',
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Upload photo"
            />
            <Upload
              size={28}
              className="mx-auto mb-3"
              style={{ color: '#ff2f8f' }}
            />
            <div
              className="font-display font-bold"
              style={{
                fontSize: 18,
                color: 'rgba(248,244,239,0.95)',
              }}
            >
              {photoUrl ? 'Change photo' : 'Upload your photo'}
            </div>
            <div
              className="font-mono mt-1"
              style={{
                fontSize: 11,
                color: 'rgba(248,244,239,0.55)',
              }}
            >
              JPG or PNG · drag & drop or tap to browse
            </div>
            <div
              className="font-mono mt-4"
              style={{ fontSize: 10, color: 'rgba(248,212,193,0.55)' }}
            >
              Your photo is used only to generate your card.
            </div>
          </div>

          {photoUrl && !revealed && (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Move
                  size={14}
                  style={{ color: 'rgba(248,212,193,0.75)' }}
                />
                <span
                  className="font-mono uppercase tracking-[0.20em] font-bold"
                  style={{
                    fontSize: 10,
                    color: 'rgba(248,212,193,0.75)',
                  }}
                >
                  Position & zoom
                </span>
              </div>
              <label className="block mb-3">
                <div
                  className="font-mono uppercase tracking-[0.14em] font-bold"
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
                >
                  Zoom
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={2.4}
                  step={0.02}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full mt-1"
                  style={{ accentColor: '#ff2f8f' }}
                />
              </label>
              <button
                onClick={() => {
                  setOffset({ x: 0, y: 0 });
                  setScale(1);
                }}
                className="font-mono uppercase tracking-[0.14em] font-bold rounded-full px-3 py-1.5"
                style={{
                  fontSize: 10,
                  color: 'rgba(248,212,193,0.85)',
                  border: '1px solid rgba(248,212,193,0.30)',
                }}
              >
                Reset position
              </button>
            </div>
          )}

          {!revealed && (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                className="font-mono uppercase tracking-[0.20em] font-bold mb-2"
                style={{ fontSize: 10, color: 'rgba(248,212,193,0.75)' }}
              >
                Card size
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['portrait', 'square'] as const).map((a) => {
                  const active = aspect === a;
                  return (
                    <button
                      key={a}
                      onClick={() => setAspect(a)}
                      className="rounded-lg px-3 py-2 border text-left transition-colors"
                      style={{
                        background: active
                          ? 'rgba(255,47,143,0.14)'
                          : 'rgba(255,255,255,0.03)',
                        borderColor: active
                          ? 'rgba(255,47,143,0.55)'
                          : 'rgba(255,255,255,0.10)',
                      }}
                    >
                      <div
                        className="font-display font-bold tracking-tight"
                        style={{
                          fontSize: 13,
                          color: active ? '#ff2f8f' : 'rgba(248,244,239,0.90)',
                        }}
                      >
                        {a === 'portrait' ? 'Portrait' : 'Square'}
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
                      >
                        {a === 'portrait'
                          ? '1122 × 1402 · WhatsApp'
                          : '1080 × 1080 · Instagram'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {validationMsg && (
            <div
              className="rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,71,120,0.10)',
                border: '1px solid rgba(255,71,120,0.35)',
                color: '#ff9bb7',
                fontSize: 13,
              }}
            >
              {validationMsg}
            </div>
          )}

          {/* Primary action: Generate OR Download+Share depending on state */}
          {!revealed ? (
            <button
              onClick={generate}
              disabled={generating}
              className="w-full rounded-2xl px-5 py-4 font-mono uppercase tracking-[0.22em] font-bold inline-flex items-center justify-center gap-2 transition-transform"
              style={{
                fontSize: 13,
                color: '#0a0a0d',
                background:
                  'linear-gradient(135deg, #ffcbdd 0%, #ff2f8f 50%, #c11f6b 100%)',
                boxShadow: '0 18px 40px rgba(255,47,143,0.35)',
                opacity: generating ? 0.7 : 1,
              }}
            >
              <Sparkles size={16} />
              {generating ? 'Generating…' : 'Generate my card'}
            </button>
          ) : (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="rounded-2xl border p-4 text-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,47,143,0.14), rgba(230,178,152,0.06))',
                  borderColor: 'rgba(255,47,143,0.45)',
                }}
              >
                <div
                  className="font-mono uppercase tracking-[0.28em] font-bold"
                  style={{ fontSize: 10, color: GOLD_LIGHT }}
                >
                  Your award
                </div>
                <div
                  className="font-display font-bold tracking-tight mt-2"
                  style={{
                    fontSize: 24,
                    fontStyle: 'italic',
                    background:
                      'linear-gradient(180deg, #ffe1e9 0%, #ff2f8f 60%, #c11f6b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {mother.title}
                </div>
              </motion.div>

              <button
                onClick={download}
                className="w-full rounded-2xl px-5 py-4 font-mono uppercase tracking-[0.22em] font-bold inline-flex items-center justify-center gap-2"
                style={{
                  fontSize: 13,
                  color: '#0a0a0d',
                  background:
                    'linear-gradient(135deg, #ffcbdd 0%, #ff2f8f 50%, #c11f6b 100%)',
                  boxShadow: '0 18px 40px rgba(255,47,143,0.35)',
                }}
              >
                <Download size={16} />
                Download card
              </button>

              <button
                onClick={shareOnWhatsApp}
                className="w-full rounded-2xl px-5 py-3 font-mono uppercase tracking-[0.20em] font-bold inline-flex items-center justify-center gap-2"
                style={{
                  fontSize: 12,
                  color: '#f8d4c1',
                  background: 'rgba(255,47,143,0.06)',
                  border: '1px solid rgba(255,47,143,0.35)',
                }}
              >
                <Share2 size={14} />
                Share on WhatsApp
              </button>

              <button
                onClick={() => {
                  setRevealed(false);
                  setGeneratedDataUrl(null);
                }}
                className="w-full rounded-2xl px-5 py-2.5 font-mono uppercase tracking-[0.18em] font-bold"
                style={{
                  fontSize: 10,
                  color: 'rgba(248,244,239,0.60)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Change photo or size
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel: live preview ──────────────────── */}
        <div>
          <div
            className="rounded-2xl border p-3"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <Download
                size={14}
                style={{ color: 'rgba(248,212,193,0.75)' }}
              />
              <span
                className="font-mono uppercase tracking-[0.20em] font-bold"
                style={{ fontSize: 10, color: 'rgba(248,212,193,0.75)' }}
              >
                Live preview
              </span>
            </div>
            <div
              ref={previewWrapRef}
              className="relative mx-auto"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                height: (previewWrapRef.current?.clientWidth ?? 320) * (cardHeight / cardWidth),
                touchAction: 'none',
                cursor: photoUrl && !revealed ? 'move' : 'default',
                background: '#0a0a0d',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <AppreciationCard
                  ref={cardRef}
                  mother={mother}
                  displayName={displayName}
                  photoUrl={photoUrl}
                  photoOffsetX={offset.x}
                  photoOffsetY={offset.y}
                  photoScale={scale}
                  aspect={aspect}
                  revealed={revealed}
                />
              </div>
            </div>
            <p
              className="font-mono mt-3 text-center"
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
            >
              {revealed
                ? 'Card exported at full 1080p — perfect for WhatsApp and printing.'
                : photoUrl
                  ? 'Drag inside the photo to reposition · then tap Generate'
                  : 'Upload your photo to see the preview come alive.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Member picker (shown when no mother is preselected) ────────

function MemberPickerSection() {
  const router = useRouter();
  return (
    <section id="pick-name" className="mt-16 scroll-mt-6">
      <SectionHeader
        kicker="Step 1 · Tap your name"
        title="Choose your name to open your card"
        subtitle="Only the 9 mothers who completed the 60-day challenge appear here. Tap your name to upload your photo and reveal your appreciation card."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-8">
        {PUREX_MOTHERS.map((m, i) => (
          <motion.button
            key={m.slug}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            onClick={() => router.push(`/purex-mothers/${m.slug}`)}
            className="text-left rounded-2xl border px-4 py-4 transition-all relative overflow-hidden group"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,210,77,0.06), rgba(184,141,44,0.03))',
              borderColor: 'rgba(255,210,77,0.28)',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-30 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,210,77,0.45), transparent 70%)',
              }}
            />
            <div className="flex items-center gap-2">
              <UserCircle
                size={16}
                style={{ color: GOLD }}
              />
              <div
                className="font-mono uppercase tracking-[0.20em] font-bold"
                style={{ fontSize: 9, color: GOLD_LIGHT }}
              >
                PURE X Mother
              </div>
            </div>
            <div
              className="font-display font-bold tracking-tight mt-2"
              style={{
                fontSize: 26,
                color: 'rgba(245,245,240,0.98)',
                fontStyle: 'italic',
              }}
            >
              {m.name}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold"
                style={{ fontSize: 10, color: GOLD_LIGHT }}
              >
                Open my card
              </div>
              <ArrowRight
                size={14}
                strokeWidth={2.5}
                className="transition-transform group-hover:translate-x-1"
                style={{ color: GOLD }}
              />
            </div>
          </motion.button>
        ))}
      </div>
      <p
        className="text-center mt-6 font-mono uppercase tracking-[0.20em] font-bold"
        style={{ fontSize: 10, color: 'rgba(251,230,163,0.55)' }}
      >
        Your award title is a surprise · revealed when you tap Generate
      </p>
    </section>
  );
}

// ─── Section: Hero ──────────────────────────────────────────────

function HeroSection({ mother }: { mother: PureXMother | null }) {
  return (
    <section className="relative pt-4 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div
          className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.28em] font-bold"
          style={{ fontSize: 11, color: GOLD }}
        >
          <span className="w-4 h-px" style={{ background: GOLD }} />
          {mother
            ? `A card for ${mother.name}`
            : 'Team PURE X · Presented by Trainer Siva Reddy'}
          <span className="w-4 h-px" style={{ background: GOLD }} />
        </div>
        <h1
          className="font-display font-bold tracking-tight mt-6"
          style={{
            fontSize: 'clamp(38px, 7vw, 68px)',
            lineHeight: 1.02,
            background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, ${GOLD_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          PURE X Mothers
          <br />
          60 Days of Strength
        </h1>
        <p
          className="mt-5 max-w-2xl mx-auto leading-relaxed"
          style={{ fontSize: 16, color: 'rgba(245,245,240,0.75)' }}
        >
          {mother
            ? `Welcome, ${mother.name}. Upload your photo below and reveal your appreciation card — a small thank-you for 60 days of strength, discipline, and grace.`
            : "Started on Mother's Day · 60 Days Completed on July 10. A celebration of mothers who chose strength, consistency, confidence, and self-care."}
        </p>
        <div
          className="inline-flex items-center flex-wrap justify-center gap-x-4 gap-y-2 mt-6 font-mono uppercase tracking-[0.22em] font-bold"
          style={{ fontSize: 10.5, color: GOLD_LIGHT }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Dumbbell size={12} /> Strength Training
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Apple size={12} /> Diet Discipline
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Footprints size={12} /> 10,000 Steps
          </span>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Section: Stats ─────────────────────────────────────────────

function StatsSection() {
  const items = [
    { icon: Calendar, label: '60 Days', sub: 'Completed', color: GOLD },
    { icon: Heart, label: 'May 10', sub: "Mother's Day start", color: GOLD_LIGHT },
    { icon: Dumbbell, label: 'Strength', sub: 'Training focus', color: GOLD_LIGHT },
    { icon: Apple, label: 'Discipline', sub: 'Diet routine', color: GOLD },
    { icon: Footprints, label: '10K / Day', sub: 'Step goal', color: ROSE },
    { icon: Crown, label: 'Siva Reddy', sub: 'Trainer', color: GOLD_DEEP },
  ];
  const collectiveM = (PUREX_MOTHERS_META.collectiveSteps / 1_000_000).toFixed(1);
  return (
    <section className="mt-12">
      <div
        className="rounded-3xl border overflow-hidden p-5"
        style={{
          borderColor: 'rgba(255,210,77,0.22)',
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(255,210,77,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #14110d 0%, #0a0c09 100%)
          `,
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} className="text-center">
                <Icon
                  size={20}
                  className="mx-auto mb-2"
                  style={{ color: it.color }}
                />
                <div
                  className="font-display font-bold tracking-tight"
                  style={{ fontSize: 15, color: 'rgba(245,245,240,0.95)' }}
                >
                  {it.label}
                </div>
                <div
                  className="font-mono uppercase tracking-[0.14em] font-bold mt-0.5"
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  {it.sub}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="mt-5 pt-4 text-center border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="font-mono uppercase tracking-[0.28em] font-bold"
            style={{ fontSize: 10, color: GOLD_LIGHT }}
          >
            Together we walked
          </div>
          <div
            className="font-display font-bold tracking-tight mt-1"
            style={{
              fontSize: 40,
              background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 60%, ${GOLD_DEEP} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {collectiveM} million steps
          </div>
          <div
            className="font-mono uppercase tracking-[0.20em] font-bold mt-0.5"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
          >
            {PUREX_MOTHERS.length} mothers · {PUREX_MOTHERS_META.totalDays} days ·{' '}
            {PUREX_MOTHERS_META.dailyStepGoal.toLocaleString()} per day
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Appreciation Wall ─────────────────────────────────

function AppreciationWallSection() {
  return (
    <section className="mt-16">
      <SectionHeader
        kicker="Every mother, seen"
        title="60 Days Appreciation Wall"
        subtitle="Nine mothers · nine different victories · one shared journey."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-8">
        {PUREX_MOTHERS.map((m) => {
          const meta = CATEGORY_META[m.category];
          return (
            <motion.div
              key={m.slug}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border p-4 relative overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse at 100% 0%, ${meta.color}18 0%, transparent 55%),
                  rgba(255,255,255,0.02)
                `,
                borderColor: `${meta.color}44`,
              }}
            >
              <div
                className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.20em] font-bold"
                style={{ fontSize: 9, color: meta.color }}
              >
                <Trophy size={10} /> {meta.short}
              </div>
              <div
                className="font-display font-bold tracking-tight mt-2"
                style={{ fontSize: 22, color: 'rgba(248,244,239,0.98)' }}
              >
                {m.name}
              </div>
              <div
                className="font-mono uppercase tracking-[0.14em] font-bold mt-0.5"
                style={{ fontSize: 10, color: 'rgba(248,244,239,0.70)' }}
              >
                {m.title}
              </div>
              <p
                className="mt-3 leading-relaxed"
                style={{ fontSize: 12.5, color: 'rgba(248,244,239,0.60)' }}
              >
                {m.message}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section: Group Message ─────────────────────────────────────

function GroupMessageSection() {
  return (
    <section className="mt-16">
      <div
        className="rounded-3xl border p-6 md:p-10"
        style={{
          background: `
            radial-gradient(ellipse at 100% 100%, rgba(255,210,77,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #14110d 0%, #0a0c09 100%)
          `,
          borderColor: 'rgba(230,178,152,0.28)',
        }}
      >
        <div
          className="font-mono uppercase tracking-[0.28em] font-bold text-center"
          style={{ fontSize: 10, color: GOLD_LIGHT }}
        >
          A note from your team
        </div>
        <h3
          className="font-display font-bold tracking-tight text-center mt-4"
          style={{
            fontSize: 'clamp(24px, 4vw, 34px)',
            lineHeight: 1.15,
            color: 'rgba(248,244,239,0.98)',
          }}
        >
          To every PURE X Mother
        </h3>
        <div
          className="mt-6 space-y-4 max-w-2xl mx-auto leading-relaxed"
          style={{ fontSize: 15, color: 'rgba(248,244,239,0.80)' }}
        >
          <p>
            You started this journey on Mother&apos;s Day with one
            decision — to take care of yourself with the same love and
            dedication you give to your family.
          </p>
          <p>
            In these 60 days, you proved that mothers can be strong,
            consistent, energetic, and unstoppable. Your strength
            training, diet discipline, 10,000 steps, plank challenges,
            wall sits, and daily commitment have inspired everyone at
            Team PURE X.
          </p>
          <p style={{ color: '#f8d4c1', fontStyle: 'italic' }}>
            This is not just a 60-day completion. This is the beginning
            of a stronger lifestyle.
          </p>
        </div>
        <div
          className="mt-8 pt-6 text-center border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="font-mono uppercase tracking-[0.28em] font-bold"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            With pride and respect
          </div>
          <div
            className="font-display font-bold tracking-tight mt-2"
            style={{ fontSize: 20, color: GOLD }}
          >
            Team PURE X
          </div>
          <div
            className="font-mono mt-1"
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              color: 'rgba(248,212,193,0.85)',
            }}
          >
            Trainer: Siva Reddy
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: CTA ───────────────────────────────────────────────

function CTASection() {
  return (
    <section className="mt-16">
      <div
        className="rounded-3xl border p-8 md:p-12 text-center"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(255,210,77,0.14) 0%, transparent 60%),
            linear-gradient(180deg, #14110d 0%, #0a0c09 100%)
          `,
          borderColor: 'rgba(255,210,77,0.35)',
        }}
      >
        <h3
          className="font-display font-bold tracking-tight"
          style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            lineHeight: 1.1,
            color: 'rgba(245,245,240,0.98)',
          }}
        >
          Join the next PURE X Mothers journey
        </h3>
        <p
          className="mt-4 max-w-2xl mx-auto"
          style={{ fontSize: 15, color: 'rgba(245,245,240,0.75)' }}
        >
          Train stronger, eat better, walk daily, and rebuild confidence
          with a supportive fitness community. Registration for the next
          batch opens soon.
        </p>
        <Link
          href="/apply"
          className="inline-flex items-center gap-2 mt-8 rounded-full px-6 py-3.5 font-mono uppercase tracking-[0.22em] font-bold"
          style={{
            fontSize: 12,
            color: '#0a0c09',
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 50%, ${GOLD_DEEP} 100%)`,
            boxShadow: '0 18px 40px rgba(255,210,77,0.30)',
          }}
        >
          Join the next batch
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}

// ─── Shared section header ──────────────────────────────────────

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <div
        className="font-mono uppercase tracking-[0.28em] font-bold"
        style={{ fontSize: 10, color: GOLD_LIGHT }}
      >
        {kicker}
      </div>
      <h2
        className="font-display font-bold tracking-tight mt-3"
        style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          lineHeight: 1.1,
          color: 'rgba(248,244,239,0.98)',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mt-3 max-w-xl mx-auto"
          style={{ fontSize: 14, color: 'rgba(248,244,239,0.65)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Ensure AnimatePresence stays referenced for future reveal transitions
void AnimatePresence;
