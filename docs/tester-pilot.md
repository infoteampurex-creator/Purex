# PURE X — Tester Pilot Pack

Everything you need to ship the debug APK to your first 5 testers
and collect useful feedback. Copy-paste the WhatsApp message,
share the APK, follow up after 3 days.

---

## Step 1 — Pick your 5 testers

Best signal comes from testers who:
- Actually go to a gym or work out at home (not your tech friends)
- Are NOT founders/builders (they overthink, they suggest features)
- Use Android phones (iOS coming later)
- Will be honest with you (not just polite)

Bad picks: family who'll say "looks great babu" no matter what.

Suggested mix:
- 2 trainers from your network (Siva, Chandralekha, etc.)
- 2 gym-goers who aren't in tech
- 1 office colleague who wants to start fitness

---

## Step 2 — Upload APK to Google Drive

1. Open https://drive.google.com
2. Right-click in My Drive → Upload file → pick `Desktop/Purex/teampurex-debug.apk`
3. After upload, right-click the file → **Share** → **Anyone with the link** can View
4. Copy the share link

---

## Step 3 — WhatsApp message (copy-paste this)

> Hi [name], I'm building a fitness app called **PureX** and would
> love your honest feedback before launch. It's NOT polished yet —
> some buttons may not work, some flows are rough. That's exactly
> what I want to find.
>
> **Install (Android only, 5 min):**
> 1. Download: [paste your Google Drive link]
> 2. Tap the downloaded APK → Android will warn "unknown source",
>    tap "Install anyway" or enable "install from unknown apps" if
>    prompted
> 3. Open the app → sign in with the email/password I'll send you
>    separately
>
> **What I'd love you to do over the next 3 days:**
> - Open the app at least once a day
> - Try logging a meal by taking a photo
> - Try linking your phone's step counter
> - Click around — tap anything that looks interesting
>
> **Then on day 3, send me ONE message answering:**
> 1. What worked well?
> 2. What broke or felt frustrating?
> 3. What did you wish was there but wasn't?
> 4. Would you keep using it? Why / why not?
> 5. Anything else?
>
> Thanks for helping. No reply needed unless you have questions.
>
> — Vishnu

---

## Step 4 — Create their accounts (before sending the link)

For each tester, you need to:

1. Go to your **admin panel** at `https://www.teampurex.com/admin`
   (or however you create clients in the trainer flow)
2. Create a client account with their email
3. Send them their email + password **in a SEPARATE WhatsApp message**
   from the install instructions — not in the same message

(If you don't have admin client-creation built yet — they can sign
up themselves at the /signup page if you've enabled public signup.)

---

## Step 5 — Set expectations: silence is OK

Don't expect quick replies. People are busy. Wait 3 full days
before nudging. After day 5, if no reply, send:

> Hi [name], any chance you got to try the PureX app I sent? Even
> "didn't open it" is useful feedback. No pressure.

---

## Step 6 — Collect feedback in one place

Don't let feedback scatter across 5 WhatsApp threads. Either:

**Option A (easiest):** Create a shared Google Doc with sections
for each tester. Copy-paste their replies in.

**Option B:** Create a Google Form with the 5 questions above and
share the form link instead of asking in WhatsApp. People reply
faster to forms than to long questions.

**Option C:** Just track in a Notion / Apple Notes doc with one
heading per tester.

---

## Step 7 — What to look for in feedback

**Watch for patterns, not individual complaints.** If 1 person
says "the avatar is weird" → ignore. If 4 out of 5 say it →
fix it.

Likely patterns you'll hear:
- "Login was annoying" → fix auth UX
- "I didn't know what to do first" → onboarding tour needed
- "The food photo got the calories wrong" → tune Gemini prompts
- "I wanted Hindi" → i18n
- "Where's the trainer chat?" → chat feature
- "Why no WhatsApp reminders?" → notifications

What you probably WON'T hear (despite us spending hours on it):
- "I want the avatar to be 3D"
- "The dashboard should have body morphs"

If users don't care about avatars → Phase 1 Unity weekend is
optional, not urgent.

---

## Step 8 — After feedback comes in

Come back here. Paste the 5 replies. I'll help you:
- Categorize what's signal vs noise
- Pick the top 3 things to fix in the next sprint
- Decide whether Unity Phase 1 is still worth the weekend

---

## Common tester install errors (have answers ready)

| What they'll say | What to reply |
|---|---|
| "It says 'app not installed'" | Make sure they enabled "install from unknown sources" in Settings → Apps → Special access. Or have them open the APK from their file manager. |
| "Login says invalid password" | Double-check you sent the right password. Reset it from your admin panel if needed. |
| "App is white screen" | They need internet on first launch — the app loads teampurex.com. Ask them to try on WiFi. |
| "Camera doesn't open" | They need to allow camera permission when prompted. If they said no, they can re-enable in Settings → Apps → Teampurex → Permissions. |
| "Steps showing 0" | Their phone needs Health Connect installed (Play Store), and they need to grant Teampurex permission to read steps. |

---

## When to stop and reflect

After 5 testers reply (or 1 week, whichever comes first):

1. Don't immediately start building "the next thing"
2. Spend a quiet 30 minutes reading all 5 sets of feedback together
3. Ask yourself: "If I could only build ONE thing this week, what
   would have the biggest impact on retention?"
4. That ONE thing is your next sprint. Not 3 things. ONE.

Then come back here and we ship it.
