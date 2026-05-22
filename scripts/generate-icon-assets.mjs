// Generate Capacitor icon source PNGs from the brand X-mark.
// Run once: `node scripts/generate-icon-assets.mjs`
// Output: assets/icon-only.png, icon-foreground.png, icon-background.png
//
// These are the inputs to `npx capacitor-assets generate`, which fans
// them out to all the platform-specific icon sizes that go into the
// Android resource folders.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SIZE = 1024;
const BG = '#0a0c09';
const FG = '#c6ff3d';

// X-mark sized for legacy (square) icon — fills most of the canvas.
function squareIconSvg() {
  const inset = 160; // 1024 - 160*2 = 704px X-mark
  const stroke = Math.round(SIZE * 0.14);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
    <path d="M ${inset} ${inset} L ${SIZE - inset} ${SIZE - inset}" stroke="${FG}" stroke-width="${stroke}" stroke-linecap="square" fill="none"/>
    <path d="M ${SIZE - inset} ${inset} L ${inset} ${SIZE - inset}" stroke="${FG}" stroke-width="${stroke}" stroke-linecap="square" fill="none"/>
  </svg>`;
}

// X-mark sized for Android adaptive icon foreground — Android clips
// the outer ~33%, so visual content must live in the centre 66%.
function adaptiveForegroundSvg() {
  const inset = 280; // X-mark within center safe zone
  const stroke = Math.round(SIZE * 0.11);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <path d="M ${inset} ${inset} L ${SIZE - inset} ${SIZE - inset}" stroke="${FG}" stroke-width="${stroke}" stroke-linecap="square" fill="none"/>
    <path d="M ${SIZE - inset} ${inset} L ${inset} ${SIZE - inset}" stroke="${FG}" stroke-width="${stroke}" stroke-linecap="square" fill="none"/>
  </svg>`;
}

function adaptiveBackgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  </svg>`;
}

await mkdir('assets', { recursive: true });

await sharp(Buffer.from(squareIconSvg())).png().toFile('assets/icon-only.png');
await sharp(Buffer.from(adaptiveForegroundSvg())).png().toFile('assets/icon-foreground.png');
await sharp(Buffer.from(adaptiveBackgroundSvg())).png().toFile('assets/icon-background.png');

console.log('Generated:');
console.log('  assets/icon-only.png');
console.log('  assets/icon-foreground.png');
console.log('  assets/icon-background.png');
