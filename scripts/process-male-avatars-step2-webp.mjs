// Step 2 of 2 — WebP encoding for male avatars (v8).
//
// Reads transparent PNGs from .tmp-bg-removed/, trims to the
// character's tight bounding box (via sharp's built-in trim, which
// is alpha-aware and noise-robust), centres in a 0.92:1 portrait
// aspect canvas at 600px wide, and writes WebP at quality 86.
//
// MUST run AFTER scripts/process-male-avatars-step1-bgremove.mjs.
//
// Run:  node scripts/process-male-avatars-step2-webp.mjs

import sharp from 'sharp';
import { readdir, mkdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const TEMP_DIR = join(PROJECT_ROOT, '.tmp-bg-removed');
const OUT_DIR = join(PROJECT_ROOT, 'public', 'twin', 'avatars');

// AvatarImage.tsx uses height = width / 0.92 → portrait aspect 0.92:1.
const TARGET_ASPECT = 0.92;
const TARGET_WIDTH = 600;
const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_ASPECT); // 652
// Vertical headroom — characters should sit slightly below top
// (head 3% from top edge) and stand on bottom (feet 1% from bottom).
const HEAD_MARGIN_RATIO = 0.03;
const FEET_MARGIN_RATIO = 0.01;

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(TEMP_DIR))
  .filter((f) => f.startsWith('male-') && f.endsWith('.png'));

if (files.length === 0) {
  console.error('No male-*.png files in', TEMP_DIR);
  console.error('Run step 1 first.');
  process.exit(1);
}

for (const file of files) {
  const inPath = join(TEMP_DIR, file);
  const outName = file.replace(/\.png$/, '.webp');
  const outPath = join(OUT_DIR, outName);

  // Step A: trim → write to a temp file so the next pipeline has
  // a clean encoded PNG to read (mixing trim buffer + extend in one
  // chain produced unpredictable output dimensions in sharp 0.34).
  const trimmedPath = join(TEMP_DIR, `_${file}`);
  const trimInfo = await sharp(inPath)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 32 })
    .png({ compressionLevel: 0 })
    .toFile(trimmedPath);
  const tw = trimInfo.width;
  const th = trimInfo.height;

  // Step B: compute target canvas size that preserves character
  // proportions. We scale the trimmed character so that its HEIGHT
  // fills (1 - HEAD_MARGIN_RATIO - FEET_MARGIN_RATIO) of the final
  // canvas height. Width then falls out of the source aspect.
  const usableHeight = TARGET_HEIGHT * (1 - HEAD_MARGIN_RATIO - FEET_MARGIN_RATIO);
  const scale = usableHeight / th;
  const charW = Math.round(tw * scale);
  const charH = Math.round(th * scale);
  // X offset to centre horizontally
  const offX = Math.round((TARGET_WIDTH - charW) / 2);
  // Y offset: head sits HEAD_MARGIN_RATIO from top
  const offY = Math.round(TARGET_HEIGHT * HEAD_MARGIN_RATIO);

  // Step C: composite the resized character on a transparent canvas
  // of exact target dimensions.
  const resizedCharacter = await sharp(trimmedPath)
    .resize({ width: charW, height: charH, fit: 'fill' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedCharacter, left: offX, top: offY }])
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(outPath);

  // Clean up the intermediate trim file
  await unlink(trimmedPath).catch(() => {});

  const final = await sharp(outPath).metadata();
  const sizeKB = Math.round((await sharp(outPath).toBuffer()).length / 1024);
  console.log(
    `  ✓ ${outName}  (${final.width}x${final.height}, ${sizeKB} KB; ` +
    `trimmed src ${tw}x${th})`
  );
}

console.log(`\n✅ Step 2 complete. Avatars updated in ${OUT_DIR}`);
