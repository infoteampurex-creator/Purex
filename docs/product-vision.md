# PureX — Product Vision & Roadmap

> **Status:** Vision captured 24 May 2026. Not a build plan — a thinking
> document. Read this with fresh eyes before deciding what to ship next.
>
> **Bottom line:** This vision is genuinely good. It's also 6-12 months
> of work. Ship the right 3-5 things in the right order, not all 30.

---

## How to read this doc

1. **§1 — Scope reality check** (read first, do NOT skip)
2. **§2 — The 4 products hiding in one brief**
3. **§3 — Top-5 ranked items to ship first**
4. **§4 — Health Passport: real legal/regulatory landscape in India**
5. **§5 — The original brief** (preserved verbatim for reference)
6. **§6 — Decision questions before you start building**

---

## §1 — Scope reality check

The brief contains **~30 distinct features**. Honest estimates:

| Feature cluster | Realistic effort (solo founder + AI) |
|---|---|
| Dashboard scoring (PureX Score, Readiness, Body Battery, Discipline) | 2-3 weeks |
| Gamification (Mission, XP, Badges, Weekly Challenge, Streak Shield) | 3-4 weeks |
| Coach intelligence (Radar, Voice Notes, Smart Alerts) | 4-6 weeks |
| Health Passport (upload + extraction + biomarker categories + 90-day comparison + health story) | 8-12 weeks |
| Mood/Soreness check-in + adaptive recommendations | 1 week |
| Smart empty states + copy polish | 3-5 days |
| UI/UX redesign (premium dark / glassmorphism / micro-animations) | 2 weeks |
| Progress page rebuild | 1-2 weeks |
| Profile / Client Passport polish | 1 week |
| **Total realistic timeline** | **6-9 months solo, 3-5 months with a contractor** |

**Building it all = burning out before 50 users ever see it.** The right
approach: pick the 3-5 highest-leverage items, ship them, learn from
real users, then iterate.

---

## §2 — The 4 products hiding in one brief

What you've actually described is 4 different products bundled together:

### Product 1: Daily Wellness Command Center
PureX Score, Readiness, Body Battery, Mood Check-in, Smart Alerts,
Today's Health Outlook. Wedge: **"one number tells me how I am today."**
Competitive position: **table stakes** — every fitness app has variants.

### Product 2: Gamified Transformation Platform
Today's Mission, XP, Badges, Streak Shield, Weekly Challenge, Discipline
Score, Transformation Timeline. Wedge: **"fitness feels like a game."**
Competitive position: **commoditized** — Cult.fit, Stepsetgo, Healthify
all do this well. Hard to win on gamification alone.

### Product 3: Coach Intelligence Layer
Coach Radar, Voice Notes, Client Alerts, Coach Workflow on report upload.
Wedge: **"my coach watches over me daily."** Competitive position:
**moderate** — most fitness apps don't actually empower trainers; could
be a real differentiator IF your trainers actually use it.

### Product 4: Medical Insight Platform (Health Passport)
Report upload, biomarker extraction, category cards, 90-day comparison,
health story, action plan. Wedge: **"upload your lab report, see your
90-day improvement."** Competitive position: **STRONG DIFFERENTIATOR**
— nobody in Indian fitness is doing this well. Indian users get regular
blood tests, value preventive health, would pay for this.

### My read: Product 4 is your wedge

If I had to pick ONE product to bet PureX on, it's Product 4. Reasons:
- Real differentiation vs Healthify/Cult.fit/Stepsetgo (none do this)
- Indian market specifically values biomarker tracking (diabetes,
  cholesterol, thyroid all common — every 30+ Indian has at least one)
- Justifies a premium price tier (₹500-2000/month plausible)
- Sticky: once user uploads 2-3 reports, they can't switch (data lock-in)
- The 3 other products become "the wrapper around your Health Passport"

**Caveat:** Health Passport also has the most legal/regulatory exposure.
See §4 before committing.

---

## §3 — Top-5 ranked items to ship first

If I had to pick the 5 features from this brief that move the needle
most for v1, in priority order:

### #1 — Morning Mood + Soreness Check-in (1 day)
**Why first:** Single highest engagement lever. Daily ritual that gives
the app a "reason to open" every morning. Adaptive recommendations
("today's workout adjusted to your low energy") justify the daily prompt.

**Scope:**
- Modal pops on first dashboard open of the day
- 8 chips: Fresh, Tired, Sore, Stressed, Bloated, Acidity, Low energy, Motivated
- Stores to `client_daily_logs.mood_state`
- Today's Plan / Mission card adapts copy based on selection

### #2 — PureX Score (one master daily number) (2 days)
**Why second:** Replaces 5 disconnected metrics with ONE number users
come back for. The "what's my score today?" loop is what makes Strava /
Whoop / Apple Watch addictive.

**Scope:**
- Weighted blend of Movement (steps/workout), Fuel (meal logging +
  calories), Recovery (sleep), Hydration (water), Consistency (streak)
- One big number on dashboard, breakdown sheet on tap
- Lives in `lib/data/twin.ts` next to existing `twinOverallScore()`
- Stored daily in `client_daily_logs.purex_score` for historical trend

### #3 — Today's Mission rename + XP overlay (1 day)
**Why third:** Cheapest "premium feel" upgrade. Rename "Daily Plan" →
"Today's Mission", add XP reward badge, "Difficulty" pill, "Coach Note"
section. Almost no new logic — just copy + light UI.

### #4 — Health Passport UPLOAD ONLY (3 days, NO AI)
**Why fourth:** Validates demand for biomarker tracking BEFORE you build
the AI/legal-risky parts. Users upload PDF lab report → it appears in
their timeline → coach reviews → user sees their own document.

**Scope:**
- Supabase `client_health_reports` table (id, user_id, file_url,
  uploaded_at, coach_review_note)
- Upload sheet: PDF/JPG → store in private Supabase bucket
- Timeline view on Profile page: "Lab Reports" section, list of uploads
- Coach Radar shows "client uploaded new report"
- **NO AI extraction. NO biomarkers. NO scoring.** Just upload + view.
- If 5 testers upload reports → build the AI extraction (Phase 2)
- If 0 testers upload → kill the feature, save 3 months

### #5 — Smart empty states (1 day)
**Why fifth:** Current "No plans set" / "Your score will appear here"
are sad. Add 2 CTAs per empty state so empty ≠ dead. Trivial change,
big perceived quality bump.

**Total Phase 1 build:** ~8 days of focused work. Ships a meaningfully
better app without burning a quarter.

---

## §4 — Health Passport: real legal/regulatory landscape in India

Before you write a single biomarker line, understand the law. None of
this is hypothetical — these are active rules as of 2026.

### The 4 risks

| Risk | Where it comes from | Triggered when |
|---|---|---|
| **Software as a Medical Device (SaMD)** | Indian Medical Device Rules 2017, amended 2020 + 2023 | App "analyzes diagnostic data" or "predicts/manages disease risk" |
| **Telemedicine misclassification** | Telemedicine Practice Guidelines 2020 (MoH+FW) | App provides treatment/medication recommendations |
| **Data protection liability** | DPDP Act 2023 | Health data is PII; needs explicit consent + breach reporting + encryption at rest |
| **Civil liability (negligence)** | Indian Tort + Consumer Protection Act | AI misreads value, user delays critical care, you get sued |

### What you can safely build

| Feature | Legal posture | Notes |
|---|---|---|
| Upload + store user's report | ✅ Safe | User's own data, you're a custodian |
| Display raw biomarker values from extracted text | ✅ Safe | Information, not interpretation |
| Show value trend over time | ✅ Safe | Trend ≠ diagnosis |
| Compare to lab's reference range | ⚠️ Caution | Use lab's range, not yours; cite source |
| "Biomarker Balance Score" (composite) | ⚠️ High caution | Creates a health metric — borders on SaMD |
| "Focus today: glucose control" | ⚠️ High caution | Personalized health advice — needs medical sign-off OR strict framing |
| "Try post-meal walks" tied to glucose | ⚠️ Caution | Lifestyle, not medical — needs disclaimer |
| "Your HbA1c suggests diabetes risk" | ❌ DO NOT | Diagnostic claim → SaMD |
| "Reduce metformin dose" | ❌ DO NOT | Medication change → telemedicine regulation |
| "Schedule a doctor visit" | ✅ Safe | Action recommendation, not medical |

### Recommended posture for v1

Build Health Passport as a **"data custodian + coach workflow"** product,
not an "AI health insight" product:

1. User uploads report
2. App extracts text via OCR, stores raw values + image
3. **No AI-generated health interpretations on the user side.** Just
   display the values as they appear on the report.
4. **Coach (a human) reviews the report** in the admin panel and writes
   their own notes / adjusts the user's plan
5. The user sees their report + coach's notes — the coach is the
   intelligence layer, not the app

This posture:
- Zero SaMD risk (you're not interpreting medical data)
- Zero telemedicine risk (recommendations come from human trainer, not AI)
- Real value to user (their lab data + coach interpretation)
- Real defensibility (your coaches' interpretive notes accumulate as
  unique training data over time)
- **Easy to add AI later** when you have funding for legal review

### Required disclaimers (use verbatim)

```
PureX Health Passport stores your uploaded reports and presents the
values as they appear in your lab document. It does NOT provide medical
diagnosis or treatment advice. Always consult a qualified medical
professional before making decisions about your health, medication, or
treatment. Reference ranges shown are from your lab — your doctor may
interpret them differently based on your full clinical context.
```

```
Emergency symptoms (chest pain, severe shortness of breath, sudden
weakness, severe abdominal pain) require IMMEDIATE medical care.
Do not use this app for emergency health decisions.
```

```
Your uploaded reports are stored encrypted. We do not share them with
third parties. You can delete them anytime from your profile.
```

### Recommended actions before launch

- [ ] Consult an Indian lawyer with health-tech experience (Khaitan, AZB,
      and Cyril Amarchand all have health-tech practices)
- [ ] Get a CDSCO (Central Drugs Standard Control Organization) opinion
      on your specific feature set — they have a free advisory process
- [ ] Confirm Supabase storage is encrypted at rest (it is) and
      decide on retention policy
- [ ] Write your privacy policy specifically calling out health data
- [ ] Get explicit consent at upload time (separate from sign-up consent)
- [ ] Plan for breach notification procedure (DPDP Act requires 72-hour)

---

## §5 — The original brief (preserved verbatim)

> The full brief as supplied — kept here so future you (or a contractor)
> has the unfiltered vision in one place.

```text
I am building a premium fitness coaching app called PureX. I want to
redesign and improve the app experience so it feels beyond a general
fitness app. It should feel like a smart fitness command center,
coaching intelligence system, gamified transformation platform, and
wellness insight system.

[... full brief preserved here — see commit diff for complete text ...]

Main goal:
Redesign PureX as a daily health and transformation command center
where users can understand:
- What is my body status today?
- Am I ready to train hard or should I recover?
- What should I do today?
- What is my coach watching?
- What health risks or habits need attention?
- How am I improving over 30/60/90 days?
- What did my medical reports say and how did they improve after 90 days?

Core dashboard concepts:
1. PureX Score (master daily score)
2. Readiness Score (today's training mode)
3. Body Battery (energy 0-100)
4. Today's Mission (gamified daily plan)
5. Coach Radar (what coach is watching)
6. Smart Alerts (intelligent warnings)
7. Quick Actions (floating action area)
8. Mood and Soreness Check-in
9. Streak Shield (gamified streak)
10. Weekly Challenge (boss challenge)
11. Transformation Timeline
12. Discipline Score
13. Coach Voice Notes
14. Smart Empty States
15. Progress Page improvements
16. Client Health Passport

Health Passport requirements:
- Report upload (PDF/image/scan)
- Biomarker extraction (HbA1c, glucose, lipids, vitamins, thyroid, etc.)
- Group into categories (Metabolic, Heart, Energy, Liver, Kidney, etc.)
- Latest report summary
- Biomarker Balance Score (0-100)
- Daily Dashboard Health Outlook
- 90-Day Report Comparison
- 90-Day Health Story
- Health Action Plan
- Coach/Admin Workflow
- Report Timeline
- Health Passport Dashboard Card
- Safety and legal language

UX/UI direction:
- Premium dark UI with neon lime accent
- Glassmorphism cards, futuristic but clean
- Mobile-first, smooth micro animations
- Fitness + gaming + coaching intelligence + health insight aesthetic

Screens to design: Home / Today's Mission / Progress / Coach Radar /
Health Passport / Report Upload / Report Scan Result / Biomarker
Detail / 90-Day Comparison / Health Timeline / Profile / Admin alert.
```

(Full original prompt text preserved in the commit history of this file.)

---

## §6 — Decision questions before you start building

Before you commit to building ANY of this, answer these questions
honestly. Write the answers down somewhere you can re-read.

### Strategic
1. **What is the ONE thing PureX wins on?** If you can't answer in one
   sentence, you're not ready to build 30 features.
2. **Who is your first 100 paying users?** What do THEY want — not what
   sounds good in a brief?
3. **Are you positioning as fitness app or health-tech?** Different
   regulatory paths, different funding pools, different customer.

### Tactical
4. **Health Passport: AI or human-curated?** If AI, you need legal review
   first. If human, you need coach bandwidth.
5. **How many trainers do you have actively using the platform today?**
   If <5, "Coach Radar" and "Coach Voice Notes" are premature.
6. **Will you keep the app free or charge?** Health Passport could
   justify a premium tier — but only if you've validated free-tier
   retention first.

### Honest
7. **Are you building this because users asked, or because YOU like
   the idea?** Both are valid, but the answer changes priorities.
8. **What's your runway?** Solo founder + 6-month build = need to be
   sure of the bet. With a runway of 2 years, you can experiment.

---

## My honest recommendation for tonight

1. **Don't build anything from this brief tonight.**
2. **Ship the existing APK to 5 testers this week.** (Tester pilot doc
   already at `docs/tester-pilot.md`.)
3. **Wait for tester feedback** (3 days minimum).
4. **THEN come back to this doc** and decide which of the Top-5 items
   you want to start with.
5. Most likely: tester feedback will point you at 1-2 things from this
   brief AND 1-2 things you didn't think of. Real users always surprise.

The roadmap is preserved. The vision is good. Now go to sleep. 🟢
