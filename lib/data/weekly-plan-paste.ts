/**
 * Weekly plan — paste parser + matcher TYPES.
 *
 * The parser is deterministic and runs on either side. The matcher
 * runs in the server action because it needs the exercise library
 * (which is cached/server-only). Types live here so the UI can render
 * the preview without dragging server code into the bundle.
 *
 * Input format (what coaches actually paste — from WhatsApp / Notes):
 *
 *   *Monday*
 *   Inclined chest press
 *   Cable cross over
 *   *Abs*
 *   Cable crunches
 *
 *   *Tuesday*
 *   Pull ups/assisted pull ups
 *   ...
 *
 *   *Thursday rest walking must*
 *   *Sunday active rest
 *
 * Recognized day headers (case-insensitive, any markdown wrapping):
 *   monday | mon
 *   tuesday | tue | tues
 *   wednesday | wed | weds
 *   thursday | thu | thur | thurs
 *   friday | fri
 *   saturday | sat
 *   sunday | sun
 *
 * "rest" appearing on the same line as the day header marks the day
 * as rest. Subheadings inside a day (abs / core / cardio / warmup /
 * cooldown / finisher / stretching) fold INTO the current day rather
 * than starting a new one — matches how coaches actually write plans.
 */

// ─── Parsed (raw, pre-match) ────────────────────────────────────

export interface ParsedDay {
  /** 0 = Monday ... 6 = Sunday — matches the schema everywhere else. */
  dayOfWeek: number;
  isRest: boolean;
  /** Free text after the day word on a rest line, e.g. "walking must". */
  restNote: string | null;
  /** Raw exercise lines (markdown stripped, ordered). */
  exerciseLines: string[];
}

export interface ParsedWeek {
  /** Always length 7, ordered 0..6. Unmentioned days default to rest. */
  days: ParsedDay[];
}

// ─── Matched (post-library lookup) ──────────────────────────────

export interface MatchedExercise {
  /** What the coach actually typed. Always preserved verbatim so the
   *  preview can show "you typed X". */
  rawText: string;
  /** Library hit. null = no confident match (flagged for review). */
  libraryId: string | null;
  /** Canonical library name. Falls back to rawText when unmatched. */
  exerciseName: string;
  targetMuscle: string | null;
  defaultSets: string | null;
  defaultReps: string | null;
  defaultRestSeconds: number | null;
  /** 0..1 — display only; helps the coach trust borderline matches. */
  confidence: number;
}

export interface MatchedDay {
  dayOfWeek: number;
  isRest: boolean;
  restNote: string | null;
  /** Suggested template name — coach can override before save. */
  suggestedTemplateName: string;
  exercises: MatchedExercise[];
}

export interface MatchedWeek {
  days: MatchedDay[];
  /** Quick stats so the preview can show "11 matched, 3 flagged". */
  totalMatched: number;
  totalUnmatched: number;
}

// ─── Parser ─────────────────────────────────────────────────────

const DAY_NAMES: Record<string, number> = {
  monday: 0, mon: 0,
  tuesday: 1, tue: 1, tues: 1,
  wednesday: 2, wed: 2, weds: 2,
  thursday: 3, thu: 3, thur: 3, thurs: 3,
  friday: 4, fri: 4,
  saturday: 5, sat: 5,
  sunday: 6, sun: 6,
};

const SUBHEADINGS = new Set([
  'abs', 'core', 'cardio',
  'warmup', 'warm up', 'warm-up',
  'cooldown', 'cool down', 'cool-down',
  'finisher', 'stretching', 'mobility', 'conditioning',
]);

/** Strip leading/trailing markdown noise so "*Monday*" → "Monday". */
function stripMarkdown(line: string): string {
  return line
    .replace(/^[\s*_~`#>\-•·]+/, '')
    .replace(/[\s*_~`]+$/, '')
    .trim();
}

/** Try to read a day header off a line. Returns null if not a day line. */
function detectDayHeader(line: string): {
  dayOfWeek: number;
  isRest: boolean;
  note: string | null;
} | null {
  const cleaned = stripMarkdown(line).toLowerCase();
  if (!cleaned) return null;
  const firstWord = cleaned.split(/[\s,:\-]+/)[0];
  if (!firstWord) return null;
  const dow = DAY_NAMES[firstWord];
  if (dow === undefined) return null;

  const remainder = cleaned.slice(firstWord.length).replace(/[*]+/g, '').trim();
  const isRest = /\brest\b/.test(remainder);
  const note = remainder ? remainder || null : null;
  return { dayOfWeek: dow, isRest, note: isRest ? note : null };
}

/**
 * Parse a free-text weekly plan into 7 day buckets. Always returns 7
 * days; any day not mentioned in the input stays as rest with no
 * exercises. Safe to call with garbage input — at worst it returns
 * the all-rest skeleton.
 */
export function parsePastedWeeklyPlan(raw: string): ParsedWeek {
  const days: ParsedDay[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    isRest: true,
    restNote: null,
    exerciseLines: [],
  }));

  let currentDay: number | null = null;

  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const dayHeader = detectDayHeader(trimmed);
    if (dayHeader) {
      currentDay = dayHeader.dayOfWeek;
      days[currentDay].isRest = dayHeader.isRest;
      days[currentDay].restNote = dayHeader.note;
      continue;
    }

    if (currentDay === null) continue;
    if (days[currentDay].isRest) continue;

    const cleaned = stripMarkdown(trimmed);
    if (!cleaned) continue;
    if (SUBHEADINGS.has(cleaned.toLowerCase())) continue;

    days[currentDay].exerciseLines.push(cleaned);
  }

  return { days };
}

// ─── Matcher utilities (pure, exported so server can use them) ──

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'with', 'on', 'in', 'of', 'to', 'for',
]);

/** Lowercase, strip everything but [a-z0-9 ], collapse whitespace. */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cheap stem — drops trailing -ed/-ing/-s. "Inclined" → "inclin",
 *  "rowing" → "row", "raises" → "raise". Good enough for exercise
 *  names where typos cluster on tense + plural. */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ing')) return word.slice(0, -3);
  if (word.endsWith('ed')) return word.slice(0, -2);
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Token set: normalized → split → drop stopwords + stems. */
export function tokenize(s: string): Set<string> {
  const tokens = normalizeName(s).split(' ');
  const out = new Set<string>();
  for (const t of tokens) {
    if (t.length <= 1) continue;
    if (STOPWORDS.has(t)) continue;
    out.add(stem(t));
  }
  return out;
}

/** 0..1 token-overlap score. Symmetric: shared tokens / max(setA, setB).
 *  A score of 1 means one side's tokens are a subset of the other and
 *  they're the same length; a score of 0 means no overlap. */
export function tokenOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / Math.max(a.size, b.size);
}

/** Confidence threshold above which we treat a fuzzy match as solid
 *  enough to populate library defaults. Below this we still surface
 *  the suggestion but mark as unmatched (flagged). */
export const MATCH_THRESHOLD = 0.6;

/** Pick the best library candidate for a single typed line. Compares
 *  against canonical name + alternate_names, returns highest-overlap
 *  hit or null. Caller decides whether to apply MATCH_THRESHOLD. */
export function pickBestMatch(
  rawText: string,
  candidates: Array<{ name: string; aliases: string[] }>
): { index: number; confidence: number } | null {
  const queryTokens = tokenize(rawText);
  if (queryTokens.size === 0) return null;

  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    let candBest = tokenOverlap(queryTokens, tokenize(cand.name));
    for (const alias of cand.aliases) {
      const s = tokenOverlap(queryTokens, tokenize(alias));
      if (s > candBest) candBest = s;
    }
    if (candBest > bestScore) {
      bestScore = candBest;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) return null;
  return { index: bestIdx, confidence: bestScore };
}

// ─── Day-name helpers (for suggested template name) ─────────────

const DAY_DISPLAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Build a sensible default template name from matched exercises.
 *  Falls back to "Mon plan" if no muscle group is dominant. */
export function suggestTemplateName(
  dayOfWeek: number,
  matchedMuscleGroups: Array<string | null>
): string {
  const counts = new Map<string, number>();
  for (const m of matchedMuscleGroups) {
    if (!m) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  if (counts.size === 0) return `${DAY_DISPLAY[dayOfWeek]} — Custom`;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  // Top 1-2 muscles, title-cased
  const top = sorted.slice(0, 2).map(([m]) => titleCaseWord(m));
  return `${DAY_DISPLAY[dayOfWeek]} — ${top.join(' + ')}`;
}

function titleCaseWord(s: string): string {
  return s.split(/\s+/).map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ');
}
