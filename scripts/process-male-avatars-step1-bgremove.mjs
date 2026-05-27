// Step 1 of 2 — Background removal for male avatars (v8).
//
// Reads source PNGs from C:/Users/vishn/Desktop/Purex/clones/, runs
// the local ONNX person-segmentation model from @imgly, and writes
// transparent PNGs to .tmp-bg-removed/.
//
// MUST run before scripts/process-male-avatars-step2-webp.mjs.
// @imgly and sharp can't coexist in the same Node process on Windows.
//
// Run:  node scripts/process-male-avatars-step1-bgremove.mjs

import { removeBackground } from '@imgly/background-removal-node';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const SOURCE_DIR = 'C:/Users/vishn/Desktop/Purex/clones';
const TEMP_DIR = join(PROJECT_ROOT, '.tmp-bg-removed');

// Source → body-type mapping (decided by visual inspection of 27 May images)
const MAPPING = {
  '9.png':  'male-heavy',     // overweight, soft body
  '11.png': 'male-lean',      // slim, mild definition
  '12.png': 'male-athletic',  // muscular abs (aspirational athletic)
  '13.png': 'male-solid',     // moderate build, slight softness
};

await mkdir(TEMP_DIR, { recursive: true });

for (const [src, outName] of Object.entries(MAPPING)) {
  process.stdout.write(`  • ${src} → ${outName}.png  removing bg... `);
  try {
    // @imgly takes a file:// URL string, NOT a raw Buffer — passing a
    // Buffer fails with "Unsupported format" because the library uses
    // the URL extension to detect the input MIME type.
    const fileUrl = pathToFileURL(join(SOURCE_DIR, src)).href;
    const blob = await removeBackground(fileUrl);
    const buffer = Buffer.from(await blob.arrayBuffer());
    await writeFile(join(TEMP_DIR, `${outName}.png`), buffer);
    console.log(`✓ ${Math.round(buffer.length / 1024)} KB`);
  } catch (err) {
    console.log(`✗ FAILED: ${err.message}`);
    process.exit(1);
  }
}

console.log(`\n✅ Step 1 complete. Now run step 2 (sharp re-encode):`);
console.log(`   node scripts/process-male-avatars-step2-webp.mjs\n`);
