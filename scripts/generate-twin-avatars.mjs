// Generate Twin avatar PNGs via Google Imagen 3.
//
// Run with: `node scripts/generate-twin-avatars.mjs`
// Reads GOOGLE_AI_API_KEY from your local .env.local — same key the
// meal-photo AI vision uses, no new credentials needed.
//
// Output: public/twin/avatars/{male,female}-{today,day30,day90}.png
//
// To iterate the look:
//   1. Tweak the prompt strings below
//   2. Re-run the script (regenerates whichever images you delete from
//      public/twin/avatars/ first — script skips files that exist)
//
// Cost: ~$0.03/image × 6 images = ~$0.18 (≈ ₹15) on Imagen 3 standard.

import { writeFile, mkdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'public', 'twin', 'avatars');

// ─── Load GOOGLE_AI_API_KEY from .env.local ──────────────────────

async function loadEnvKey() {
  if (process.env.GOOGLE_AI_API_KEY) return process.env.GOOGLE_AI_API_KEY;
  try {
    const { readFile } = await import('node:fs/promises');
    const env = await readFile(join(PROJECT_ROOT, '.env.local'), 'utf8');
    const match = env.match(/^GOOGLE_AI_API_KEY=(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    // .env.local missing — fall through
  }
  return null;
}

// ─── Prompts — based on user's spec, extended for render quality ─

// Same SEED across the 3 stages of one gender keeps the same person's
// face / build / outfit recognisable across the transformation arc.
const MALE_SEED = 481723;
const FEMALE_SEED = 209584;

const BASE_RENDER_DIRECTIVES =
  'Photorealistic 3D render, studio lighting, clean neutral background, ' +
  'full body shot facing camera, premium fitness aesthetic, sharp focus, ' +
  'professional quality, 4K detail.';

const GENERATIONS = [
  // ─── Male ───
  {
    name: 'male-today',
    seed: MALE_SEED,
    prompt:
      'A fit young man in his late 20s with a clean athletic look. ' +
      'Wearing modern, form-fitting performance grey workout gear: ' +
      'sleeveless compression top and shorts. Standing in a relaxed ' +
      'confident athletic pose. ' +
      BASE_RENDER_DIRECTIVES,
  },
  {
    name: 'male-day30',
    seed: MALE_SEED,
    prompt:
      'The same fit young man in his late 20s as before. Same face, ' +
      'same outfit (form-fitting grey sleeveless compression top and ' +
      'shorts). Visibly slightly more muscle definition in arms and ' +
      'chest than the starting version. Standing in a confident ' +
      'athletic pose. ' +
      BASE_RENDER_DIRECTIVES,
  },
  {
    name: 'male-day90',
    seed: MALE_SEED,
    prompt:
      'The same young man as before, now with increased muscle ' +
      'definition and slightly more pronounced vascularity, ' +
      'maintaining a realistic, professional fitness aesthetic. ' +
      'Same outfit (form-fitting grey sleeveless compression top and ' +
      'shorts). Confident, athletic posture, slight power stance. ' +
      BASE_RENDER_DIRECTIVES,
  },

  // ─── Female ───
  {
    name: 'female-today',
    seed: FEMALE_SEED,
    prompt:
      'A fit young woman in her late 20s with an athletic, toned ' +
      'physique. Wearing modern, form-fitting performance grey ' +
      'workout gear: racerback tank and athletic leggings. Standing ' +
      'in a relaxed confident athletic pose. ' +
      BASE_RENDER_DIRECTIVES,
  },
  {
    name: 'female-day30',
    seed: FEMALE_SEED,
    prompt:
      'The same fit young woman in her late 20s as before. Same face, ' +
      'same outfit (grey racerback tank and athletic leggings). ' +
      'Visibly more toned arms and abs than the starting version. ' +
      'Standing in a confident athletic pose. ' +
      BASE_RENDER_DIRECTIVES,
  },
  {
    name: 'female-day90',
    seed: FEMALE_SEED,
    prompt:
      'The same young woman as before, now with improved muscle ' +
      'definition and a more athletic, defined silhouette, ' +
      'maintaining a realistic, professional fitness aesthetic. ' +
      'Same outfit (grey racerback tank and athletic leggings). ' +
      'Confident athletic posture, slight power stance. ' +
      BASE_RENDER_DIRECTIVES,
  },
];

// ─── Google Imagen 3 REST call ───────────────────────────────────

async function generateOne(prompt, seed, apiKey) {
  // Imagen 3 generate model — accessible via the same v1beta endpoint
  // as Gemini. Returns base64-encoded image bytes.
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    'imagen-3.0-generate-002:predict?key=' +
    apiKey;

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '3:4', // portrait — character shots
      personGeneration: 'allow_adult',
      seed,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Imagen ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) {
    throw new Error('No image in response: ' + JSON.stringify(data).slice(0, 500));
  }
  return Buffer.from(b64, 'base64');
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const apiKey = await loadEnvKey();
  if (!apiKey) {
    console.error(
      '\n❌ GOOGLE_AI_API_KEY not found.\n\n' +
        '  Set it in .env.local (same key you use for meal-photo AI):\n' +
        '    GOOGLE_AI_API_KEY=AIza...\n\n' +
        '  Get one at https://aistudio.google.com/apikey if needed.\n'
    );
    process.exit(1);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\nGenerating ${GENERATIONS.length} Twin avatars...\n`);

  for (const gen of GENERATIONS) {
    const outPath = join(OUTPUT_DIR, `${gen.name}.png`);
    if (existsSync(outPath)) {
      console.log(`  ⏭  ${gen.name}.png  already exists, skipping`);
      continue;
    }
    process.stdout.write(`  • ${gen.name}.png  generating... `);
    try {
      const buf = await generateOne(gen.prompt, gen.seed, apiKey);
      await writeFile(outPath, buf);
      console.log(`✓ saved (${Math.round(buf.length / 1024)} KB)`);
    } catch (err) {
      console.log(`✗ FAILED`);
      console.error(`    ${err.message}\n`);
    }
  }

  console.log(`\n✅ Done. Check ${OUTPUT_DIR}\n`);
  console.log(
    'If a render isn\'t right, delete that PNG and re-run — the script\n' +
      'only regenerates missing files. Tweak the prompts in this script\n' +
      'to nudge the style.\n'
  );
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
