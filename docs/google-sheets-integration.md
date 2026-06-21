# Google Sheets Integration — runbook

Lets the coach edit certain datasets directly in Google Sheets without a
code change. The app reads the Sheet on a 5-minute revalidate cache. Sync
direction is one-way (Sheets → App, read-only).

## Why this exists

Three datasets in the app benefit from coach-editable content:

| Dataset | Where it lives now | Why move it |
|---|---|---|
| **Food library** (powers the "Swap" suggestions on /client/nutrition) | Hard-coded in `lib/data/food-sources.ts` | Coach can add region-specific foods without a deploy |
| **Workout templates** | DB table `workout_templates` | Coach iterates faster; admin Sheet doubles as the off-line backup |
| **Pricing / packages** | Marketing constants | Pricing changes shouldn't require an engineer |

Each integrates independently — you can wire one and skip the others.

This first foundation PR ships **just the food library** end-to-end as
proof of the pattern. Workout templates and pricing follow easily once
the plumbing is in place.

## One-time setup

### 1. Create a service account

A service account is a Google identity that the server uses to read
your Sheets — no per-user OAuth dance, no expiring tokens.

1. Go to https://console.cloud.google.com — create a project (or pick
   an existing one). Name it something like "PURE X Sheets".
2. **APIs & Services → Library → Google Sheets API → Enable**
3. **IAM & Admin → Service Accounts → Create Service Account**
   - Name: `PURE X Sheets Reader`
   - Description: `Read-only access to admin-curated Sheets`
   - Skip role granting (the per-Sheet share below is finer-grained)
   - Click **Done**
4. Click the new service account → **Keys → Add Key → Create new key →
   JSON**. A `.json` file downloads. Keep this safe — it's the
   credential.

### 2. Add the credentials to Vercel

From the JSON file you just downloaded:

| Env var | Value from JSON |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` (paste with literal `\n` sequences intact — the reader converts them back) |

In Vercel: **Project → Settings → Environment Variables → Add**.
Apply to Production + Preview + Development.

### 3. Create the food library Sheet

1. https://sheets.google.com → Blank
2. Name it "PURE X — Food Library"
3. Add the header row in `A1:M1`:

   ```
   id  name  category  meal_types  portion  kcal  protein_g  carbs_g  fats_g  fiber_g  veg  cuisine  indian_staple
   ```

4. Add foods starting at row 2. One example row:

   ```
   custom-millet-dosa  Millet Dosa  carbs  breakfast,lunch  2 medium  220  6  38  4  3  TRUE  indian  TRUE
   ```

   Rules:
   - `category`: `carbs` | `protein` | `fat` | `fiber`
   - `meal_types`: comma-separated subset of `breakfast`, `lunch`,
     `snack`, `dinner`, `pre_workout`
   - `cuisine`: `universal` | `indian` | `mediterranean` | `western`
     | `east_asian` | `middle_eastern` | `latin`
   - `veg` / `indian_staple`: `TRUE` or `FALSE`
   - `kcal` and macros are whole numbers

   Rows with invalid values are skipped (warning logged in Vercel).

### 4. Share the Sheet with the service account

In the Sheet → **Share** → paste the `client_email` from the JSON →
role **Viewer** → uncheck "Notify people" → **Send**.

### 5. Set the Sheet ID env var

Copy the long string in the Sheet URL between `/d/` and `/edit` —
that's the Sheet ID. Paste it into Vercel as:

```
SHEET_FOOD_LIBRARY_ID=1AbCdEfG-EXAMPLE-123abc...
```

Redeploy (or trigger a new build) so the env vars take effect.

### 6. Verify it's working

After the next deploy:

- Add a food row to the Sheet
- Wait up to 5 minutes (the cache TTL)
- The food shows up in the "Swap" sheet on `/client/nutrition` for
  any item at a similar kcal

If something looks wrong, check Vercel logs for the prefix
`[food-sources-from-sheet]` — invalid rows log a warning with row
number + the first few cells.

## How the cache works

Sheets reads are wrapped in Next.js `unstable_cache` with a 5-minute
`revalidate`. With 3 datasets at 5 min apart that's roughly **36 reads
per hour against the 100/100s Sheets API quota** — comfortably free
tier even with bursts.

To force a fresh fetch in dev: restart the Next dev server, or wait
out the cache window.

## Pattern for the next dataset

`lib/google/sheets-client.ts` exposes `fetchSheet({ spreadsheetId,
range })`. Per-dataset adapters parse the raw cell matrix into typed
shapes. To add a new sync:

1. Create `lib/data/<thing>-from-sheet.ts`
2. Read with `fetchSheet({ spreadsheetId: process.env.SHEET_<THING>_ID!, range: 'Sheet1!A2:Z2000' })`
3. Parse each row into your domain type; skip + log invalid rows
4. Document the column layout at the top of the file
5. Wire into your existing consumer (with fallback when the env var is
   unset so the app keeps working without Sheet access)
