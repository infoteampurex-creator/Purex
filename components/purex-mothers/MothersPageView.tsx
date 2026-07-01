'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  UserCircle,
  Crown,
  Heart,
  Move,
  ChevronRight,
} from 'lucide-react';
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
  /** Preselected via /purex-mothers/[slug] route, otherwise null. */
  initialMother: PureXMother | null;
}

type Aspect = 'portrait' | 'square';

export function MothersPageView({ initialMother }: Props) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialMother?.slug ?? null
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [aspect, setAspect] = useState<Aspect>('portrait');
  const [exporting, setExporting] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  const selectedMother = useMemo(
    () => PUREX_MOTHERS.find((m) => m.slug === selectedSlug) ?? null,
    [selectedSlug]
  );

  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  // Scroll to card generator when a mother is picked
  const generatorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (selectedMother && generatorRef.current) {
      generatorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [selectedMother]);

  // ─── Photo upload ─────────────────────────────────────────────

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

  // ─── Drag-to-position on preview ──────────────────────────────

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
    // Scale by preview scale factor so 1px drag = 1px card
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

  // ─── Preview scale factor ─────────────────────────────────────
  // The card renders at real dimensions (1080x…) so the export is
  // pixel-perfect. On screen we scale it down to fit the container.
  const cardWidth = 1080;
  const cardHeight = aspect === 'portrait' ? 1350 : 1080;
  const [previewSize, setPreviewSize] = useState({ w: 320, s: 0.296 });
  const previewScale = previewSize.s;
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const update = () => {
      const container = previewWrapRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const s = containerWidth / cardWidth;
      setPreviewSize({ w: containerWidth, s });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [cardWidth]);

  // ─── Generate + download ──────────────────────────────────────

  const runConfetti = () => {
    // Rose-gold + pink confetti burst
    confetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 45,
      origin: { y: 0.35 },
      colors: ['#ff2f8f', '#e8b298', '#f8d4c1', '#ffd700', '#c11f6b'],
      scalar: 1.1,
    });
  };

  const validate = () => {
    if (!selectedMother) {
      setValidationMsg('Please select your name first.');
      return false;
    }
    if (!photoUrl) {
      setValidationMsg('Please upload your photo to generate the card.');
      return false;
    }
    setValidationMsg(null);
    return true;
  };

  const generateAndDownload = async () => {
    if (!validate()) return;
    if (!cardRef.current || !selectedMother) return;
    setExporting(true);
    try {
      runConfetti();
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1, // card already rendered at real px
        width: cardWidth,
        height: cardHeight,
      });
      const link = document.createElement('a');
      link.download = `team-purex-mothers-${selectedMother.slug}-60-days-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[purex-mothers] export failed', err);
      setValidationMsg('Could not generate the card. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const shareOnWhatsApp = async () => {
    if (!validate()) return;
    if (!selectedMother) return;
    // Try the native share sheet first (mobile) — if the browser can
    // share a file, that's the best UX (image attached, caption ready).
    try {
      if (!cardRef.current) return;
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: cardWidth,
        height: cardHeight,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `team-purex-mothers-${selectedMother.slug}-60-days-card.png`,
        { type: 'image/png' }
      );
      const caption = `60 Days of PURE X Mothers Strength ✨\n${selectedMother.name} — ${selectedMother.title}\nTrainer: ${PUREX_MOTHERS_META.trainerName}`;
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (
        nav.share &&
        nav.canShare &&
        nav.canShare({ files: [file] })
      ) {
        await nav.share({ files: [file], text: caption, title: caption });
        return;
      }
      // Fallback: download the file then open WhatsApp with just the caption
      const link = document.createElement('a');
      link.download = file.name;
      link.href = dataUrl;
      link.click();
      const url = `https://wa.me/?text=${encodeURIComponent(caption + ' (Attach the card image you just downloaded.)')}`;
      window.open(url, '_blank');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[purex-mothers] share failed', err);
      setValidationMsg('Could not share. Try Download and share manually.');
    }
  };

  return (
    <main
      className="relative min-h-screen"
      style={{ background: '#0a0a0d', color: '#f8f4ef' }}
    >
      {/* Background atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 0%, rgba(255,47,143,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 60%, rgba(230,178,152,0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.05) 0%, transparent 55%)
          `,
        }}
      />

      <div className="relative container-safe max-w-5xl mx-auto px-4 pt-20 pb-24">
        <HeroSection />
        <StatsSection />

        {/* ─── Member picker ─────────────────────────────── */}
        <section className="mt-16">
          <SectionHeader
            kicker="Step 1"
            title="Choose your name to generate your card"
            subtitle="Tap your name to preselect your appreciation card, then upload your photo below."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
            {PUREX_MOTHERS.map((m) => {
              const active = selectedSlug === m.slug;
              return (
                <button
                  key={m.slug}
                  onClick={() => {
                    setSelectedSlug(m.slug);
                    router.replace(`/purex-mothers/${m.slug}`, { scroll: false });
                  }}
                  className="text-left rounded-2xl border px-4 py-3.5 transition-all"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(255,47,143,0.14), rgba(230,178,152,0.06))'
                      : 'rgba(255,255,255,0.02)',
                    borderColor: active
                      ? 'rgba(255,47,143,0.55)'
                      : 'rgba(255,255,255,0.08)',
                    boxShadow: active
                      ? '0 12px 28px rgba(255,47,143,0.20)'
                      : 'none',
                    transform: active ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <UserCircle
                      size={16}
                      style={{ color: active ? '#ff2f8f' : 'rgba(248,212,193,0.55)' }}
                    />
                    <div
                      className="font-display font-bold tracking-tight"
                      style={{
                        fontSize: 16,
                        color: active ? '#ff2f8f' : 'rgba(248,244,239,0.95)',
                      }}
                    >
                      {m.name}
                    </div>
                  </div>
                  <div
                    className="font-mono uppercase tracking-[0.14em] font-bold mt-1"
                    style={{
                      fontSize: 9.5,
                      color: 'rgba(248,244,239,0.55)',
                    }}
                  >
                    {m.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Photo + Preview ────────────────────────────── */}
        <section ref={generatorRef} className="mt-16 scroll-mt-6">
          <SectionHeader
            kicker="Step 2 & 3"
            title="Upload your photo, preview your card"
            subtitle="Drag the photo inside the circle to reposition, or use the zoom slider."
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 mt-8">
            {/* Left — upload + controls */}
            <div className="space-y-4">
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
                  {photoUrl ? 'Change photo' : 'Upload Your Photo'}
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
                  style={{
                    fontSize: 10,
                    color: 'rgba(248,212,193,0.55)',
                  }}
                >
                  Your photo is used only to generate your card.
                </div>
              </div>

              {/* Position controls */}
              {photoUrl && (
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

              {/* Aspect ratio + actions */}
              <div
                className="rounded-2xl border p-4 space-y-3"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono uppercase tracking-[0.20em] font-bold"
                    style={{
                      fontSize: 10,
                      color: 'rgba(248,212,193,0.75)',
                    }}
                  >
                    Card size
                  </span>
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
                            color: active
                              ? '#ff2f8f'
                              : 'rgba(248,244,239,0.90)',
                          }}
                        >
                          {a === 'portrait' ? 'Portrait' : 'Square'}
                        </div>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.50)',
                          }}
                        >
                          {a === 'portrait'
                            ? '1080 × 1350 · WhatsApp'
                            : '1080 × 1080 · Instagram'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Validation + Generate button */}
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

              <button
                onClick={generateAndDownload}
                disabled={exporting}
                className="w-full rounded-2xl px-5 py-4 font-mono uppercase tracking-[0.22em] font-bold inline-flex items-center justify-center gap-2 transition-transform"
                style={{
                  fontSize: 13,
                  color: '#0a0a0d',
                  background:
                    'linear-gradient(135deg, #ffcbdd 0%, #ff2f8f 50%, #c11f6b 100%)',
                  boxShadow: '0 18px 40px rgba(255,47,143,0.35)',
                  opacity: exporting ? 0.7 : 1,
                }}
              >
                <Sparkles size={16} />
                {exporting ? 'Generating…' : 'Generate my card'}
              </button>

              <button
                onClick={shareOnWhatsApp}
                disabled={exporting}
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
            </div>

            {/* Right — live preview */}
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
                    style={{
                      fontSize: 10,
                      color: 'rgba(248,212,193,0.75)',
                    }}
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
                    height: previewSize.w * (cardHeight / cardWidth),
                    touchAction: 'none',
                    cursor: photoUrl ? 'move' : 'default',
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
                      mother={
                        selectedMother ?? {
                          slug: 'placeholder',
                          name: 'Your Name',
                          title: 'Your Award',
                          category: 'all_rounder',
                          message:
                            'Select your name above to preview your card.',
                        }
                      }
                      photoUrl={photoUrl}
                      photoOffsetX={offset.x}
                      photoOffsetY={offset.y}
                      photoScale={scale}
                      aspect={aspect}
                    />
                  </div>
                </div>
                <p
                  className="font-mono mt-3 text-center"
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  Drag inside the photo to reposition · pixel-perfect export
                </p>
              </div>
            </div>
          </div>
        </section>

        <AppreciationWallSection />
        <GroupMessageSection />
        <CTASection />
      </div>
    </main>
  );
}

// ─── Section: Hero ──────────────────────────────────────────────

function HeroSection() {
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
          style={{ fontSize: 11, color: '#f8d4c1' }}
        >
          <Heart size={12} />
          Team PURE X · Presented by Trainer Siva Reddy
        </div>
        <h1
          className="font-display font-bold tracking-tight mt-6"
          style={{
            fontSize: 'clamp(38px, 7vw, 68px)',
            lineHeight: 1.02,
            background:
              'linear-gradient(180deg, #ffe1e9 0%, #ff2f8f 55%, #c11f6b 100%)',
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
          style={{ fontSize: 16, color: 'rgba(248,244,239,0.75)' }}
        >
          Started on Mother&apos;s Day · 60 Days Completed on July 10.
          A celebration of mothers who chose strength, consistency,
          confidence, and self-care.
        </p>
        <div
          className="inline-flex items-center flex-wrap justify-center gap-x-4 gap-y-2 mt-6 font-mono uppercase tracking-[0.22em] font-bold"
          style={{ fontSize: 10.5, color: '#f8d4c1' }}
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
    { icon: Calendar, label: '60 Days', sub: 'Completed', color: '#ff2f8f' },
    { icon: Heart, label: 'May 10', sub: "Mother's Day start", color: '#e8b298' },
    { icon: Dumbbell, label: 'Strength', sub: 'Training focus', color: '#f8d4c1' },
    { icon: Apple, label: 'Discipline', sub: 'Diet routine', color: '#ffd700' },
    { icon: Footprints, label: '10K / Day', sub: 'Step goal', color: '#ff9bb7' },
    { icon: Crown, label: 'Siva Reddy', sub: 'Trainer', color: '#c68960' },
  ];
  const collectiveM = (PUREX_MOTHERS_META.collectiveSteps / 1_000_000).toFixed(1);
  return (
    <section className="mt-12">
      <div
        className="rounded-3xl border overflow-hidden p-5"
        style={{
          borderColor: 'rgba(255,47,143,0.22)',
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(255,47,143,0.10) 0%, transparent 60%),
            linear-gradient(180deg, #14090f 0%, #0a0a0d 100%)
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
                  style={{ fontSize: 15, color: 'rgba(248,244,239,0.95)' }}
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
            style={{ fontSize: 10, color: '#f8d4c1' }}
          >
            Together we walked
          </div>
          <div
            className="font-display font-bold tracking-tight mt-1"
            style={{
              fontSize: 40,
              background:
                'linear-gradient(180deg, #ffe1e9 0%, #ff2f8f 60%, #c11f6b 100%)',
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
            radial-gradient(ellipse at 100% 100%, rgba(255,47,143,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #16090f 0%, #0a0a0d 100%)
          `,
          borderColor: 'rgba(230,178,152,0.28)',
        }}
      >
        <div
          className="font-mono uppercase tracking-[0.28em] font-bold text-center"
          style={{ fontSize: 10, color: '#f8d4c1' }}
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
            style={{ fontSize: 20, color: '#ff2f8f' }}
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
            radial-gradient(ellipse at 50% 0%, rgba(255,47,143,0.14) 0%, transparent 60%),
            linear-gradient(180deg, #14090f 0%, #0a0a0d 100%)
          `,
          borderColor: 'rgba(255,47,143,0.35)',
        }}
      >
        <h3
          className="font-display font-bold tracking-tight"
          style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            lineHeight: 1.1,
            color: 'rgba(248,244,239,0.98)',
          }}
        >
          Join the next PURE X Mothers journey
        </h3>
        <p
          className="mt-4 max-w-2xl mx-auto"
          style={{ fontSize: 15, color: 'rgba(248,244,239,0.75)' }}
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
            color: '#0a0a0d',
            background:
              'linear-gradient(135deg, #ffcbdd 0%, #ff2f8f 50%, #c11f6b 100%)',
            boxShadow: '0 18px 40px rgba(255,47,143,0.35)',
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
        style={{ fontSize: 10, color: '#f8d4c1' }}
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
// Ensure AnimatePresence is referenced so tree-shaking keeps it.
void AnimatePresence;
