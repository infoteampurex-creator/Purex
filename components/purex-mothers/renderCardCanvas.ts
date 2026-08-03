/**
 * Render the mothers appreciation card with the plain Canvas 2D API.
 *
 * Background
 * ----------
 * We originally exported the card via html-to-image, which lifts the
 * live DOM node into an SVG <foreignObject> and rasterises it. That
 * pipeline is fragile on iOS Safari: fonts race, foreignObject clips
 * on certain viewports, cross-origin images taint the canvas, and the
 * output was sometimes blank (Praneetha's case) or unstyled.
 *
 * Canvas 2D is universally supported (iOS 6+) and paints pixels
 * directly — no foreignObject, no SVG-to-raster step, no font race
 * because we can wait for document.fonts.load() with the exact font
 * spec we're about to draw.
 *
 * The trade-off is that we lose CSS convenience — text wrapping, the
 * background-clip gold gradient, drop shadows — and have to hand-code
 * those. For the mothers card that's fine because the layout is fixed
 * and every mother renders identically apart from photo + name +
 * title + message.
 */

type Aspect = 'portrait' | 'square';

export interface CardRenderOptions {
  aspect: Aspect;
  templateSrc: string;
  photoUrl: string | null;
  photoOffsetX: number;
  photoOffsetY: number;
  photoScale: number;
  name: string;
  title: string;
  message: string;
  revealed: boolean;
}

// Overlay coordinates — must stay identical to the ones in
// AppreciationCard.tsx so the on-screen preview matches the exported
// PNG down to the pixel.
const LAYOUT = {
  portrait: {
    W: 1122,
    H: 1402,
    photoCx: 561,
    photoCy: 690,
    photoR: 215,
    nameTop: 985,
    nameHeight: 90,
    nameFont: 72,
    titleTop: 1115,
    titleHeight: 45,
    titleFont: 18,
    titleLeft: 280,
    titleRight: 280,
    msgTop: 1215,
    msgHeight: 130, // enough for 3 lines at 20 px + 1.45 line-height
    msgFont: 20,
    msgLeft: 200,
    msgRight: 200,
  },
  square: {
    W: 1080,
    H: 1080,
    photoCx: 540,
    photoCy: 500,
    photoR: 170,
    nameTop: 650,
    nameHeight: 100,
    nameFont: 108,
    titleTop: 810,
    titleHeight: 40,
    titleFont: 20,
    titleLeft: 180,
    titleRight: 180,
    msgTop: 0,
    msgHeight: 0,
    msgFont: 0,
    msgLeft: 0,
    msgRight: 0,
  },
} as const;

// Load an image from src into an HTMLImageElement. Cross-origin
// attribute is omitted intentionally: the template PNG is same-origin
// and the photo is a data: URL — neither needs CORS negotiation, and
// setting crossOrigin has caused CORS-taint bugs on older iOS Safari.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Ensure the exact font+weight+style combos we'll ask the canvas to
// draw are actually decoded and metric-ready. Without this, on a slow
// mobile network Canvas silently falls back to a system serif.
async function ensureFonts(fontStrings: string[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all(
      fontStrings.map((f) =>
        document.fonts.load(f).catch(() => {
          /* best-effort */
        })
      )
    );
    await document.fonts.ready;
  } catch {
    // ignore — canvas will just use whatever is available
  }
}

/**
 * Simple greedy word-wrap on canvas — breaks text into as many lines
 * as needed within maxWidth. Preserves whole words; doesn't attempt
 * hyphenation. Handles ASCII + Devanagari fine.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth) {
      current = attempt;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Main entry: render the given card configuration to a PNG blob.
 *
 * Returns a data URL rather than a blob so it slots in the existing
 * download / share pipeline. iOS Safari's data-URL size limit is
 * ~10 MB for anchor downloads, but our card is ~200-400 KB PNG so
 * that's not a concern.
 */
export async function renderMothersCard(
  opts: CardRenderOptions
): Promise<string> {
  const cfg = LAYOUT[opts.aspect];
  const W = cfg.W;
  const H = cfg.H;

  // Font specs must match AppreciationCard exactly. Each entry is a
  // `<style> <weight> <size>px "<family>"` string that Canvas 2D
  // parses into ctx.font AND document.fonts.load() accepts.
  const nameFontSpec = `italic 700 ${cfg.nameFont}px "Playfair Display", Georgia, serif`;
  const titleFontSpec = `700 ${cfg.titleFont}px "JetBrains Mono", ui-monospace, monospace`;
  const msgFontSpec = `italic 600 ${cfg.msgFont}px "Playfair Display", Georgia, serif`;

  await ensureFonts([nameFontSpec, titleFontSpec, msgFontSpec]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // 1. Solid black background so any transparent template area is
  //    filled in the exported PNG.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // 2. Template art — same "object-fit: cover" behaviour as the live
  //    preview: scale up to cover the frame, centered.
  try {
    const template = await loadImage(opts.templateSrc);
    const scale = Math.max(W / template.width, H / template.height);
    const drawW = template.width * scale;
    const drawH = template.height * scale;
    const dx = (W - drawW) / 2;
    const dy = (H - drawH) / 2;
    ctx.drawImage(template, dx, dy, drawW, drawH);
  } catch {
    // Template failed — carry on with black background so the name
    // and title still render (better than blank).
  }

  // 3. Photo circle. Save + clip to the ring, then paint the user's
  //    photo scaled + offset the same way the live preview does. The
  //    photo is drawn "object-fit: cover" inside the circle bounds,
  //    with the drag/zoom translate applied on top.
  if (opts.photoUrl) {
    try {
      const photo = await loadImage(opts.photoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cfg.photoCx, cfg.photoCy, cfg.photoR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Compute the source-fit rectangle for object-fit: cover inside
      // the circle's bounding square (2R x 2R).
      const boxSize = cfg.photoR * 2;
      const boxX = cfg.photoCx - cfg.photoR;
      const boxY = cfg.photoCy - cfg.photoR;
      const coverScale = Math.max(
        boxSize / photo.width,
        boxSize / photo.height
      );
      const baseW = photo.width * coverScale;
      const baseH = photo.height * coverScale;
      const finalW = baseW * opts.photoScale;
      const finalH = baseH * opts.photoScale;
      const finalX = boxX + (boxSize - finalW) / 2 + opts.photoOffsetX;
      const finalY = boxY + (boxSize - finalH) / 2 + opts.photoOffsetY;
      ctx.drawImage(photo, finalX, finalY, finalW, finalH);

      ctx.restore();
    } catch {
      // Photo failed — skip; leave the ring empty.
    }
  }

  // 4. Mother's name in gold. Canvas doesn't natively support
  //    background-clip gradient text, so we roll our own with a
  //    linearGradient fillStyle at the correct baseline.
  const nameCenterY = cfg.nameTop + cfg.nameHeight / 2;
  ctx.font = nameFontSpec;
  const nameGrad = ctx.createLinearGradient(
    0,
    nameCenterY - cfg.nameFont / 2,
    0,
    nameCenterY + cfg.nameFont / 2
  );
  nameGrad.addColorStop(0, '#fff2b3');
  nameGrad.addColorStop(0.5, '#ffd94a');
  nameGrad.addColorStop(1, '#a67c00');
  ctx.fillStyle = nameGrad;
  ctx.fillText(opts.name.trim() || '—', W / 2, nameCenterY);

  // 5. Award title (or masked ✦ before reveal).
  const titleCenterY = cfg.titleTop + cfg.titleHeight / 2;
  ctx.font = titleFontSpec;
  ctx.fillStyle = opts.revealed ? '#fff2b3' : 'rgba(255,215,74,0.45)';
  // Approximate letter-spacing 0.28em by drawing per-character with
  // padded advance. Canvas 2D letterSpacing exists on some browsers
  // but iOS Safari < 17 doesn't support it, so we hand-roll it.
  drawSpacedText(
    ctx,
    opts.revealed ? opts.title.toUpperCase() : '✦ ✦ ✦',
    W / 2,
    titleCenterY,
    cfg.titleFont * 0.28
  );

  // 6. Appreciation message (portrait only, revealed only).
  if (opts.aspect === 'portrait' && cfg.msgTop > 0 && opts.revealed) {
    ctx.font = msgFontSpec;
    ctx.fillStyle = '#faeed4';
    const maxWidth = W - cfg.msgLeft - cfg.msgRight;
    const lines = wrapText(ctx, opts.message.trim(), maxWidth);
    const lineHeight = cfg.msgFont * 1.45;
    let y = cfg.msgTop + cfg.msgFont * 0.7;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += lineHeight;
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Hand-rolled letter-spacing draw for the title. iOS Safari < 17 does
 * not support ctx.letterSpacing, so we walk each character, measure
 * its advance, and offset by the spacing amount.
 */
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  spacingPx: number
): void {
  const chars = Array.from(text);
  if (chars.length === 0) return;
  // Compute total width including gaps
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((s, w) => s + w, 0) + spacingPx * (chars.length - 1);
  let x = cx - totalWidth / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, cy);
    x += widths[i] + spacingPx;
  }
  ctx.textAlign = prevAlign;
}
