# PURE X — Auth Setup Guide (Phase 2)

Supabase-powered login, signup, password reset, session persistence, and route protection.

## TL;DR — 5 minute setup

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard/new)
2. Run the SQL migration (below)
3. Copy the API keys into `.env.local`
4. Configure auth settings in Supabase dashboard
5. `npm run dev`

---

## Step 1 — Create Supabase project

- Go to [Supabase dashboard](https://supabase.com/dashboard) → New Project
- Name it "PURE X" (or whatever)
- Pick region: **Mumbai (ap-south-1)** for India latency, or London (eu-west-2) if you prefer
- Set a strong database password and save it somewhere safe
- Wait ~2 minutes for provisioning

---

## Step 2 — Run the auth migration

Copy the contents of `supabase/migrations/00001_auth_foundation.sql` into the Supabase SQL editor and run.

This creates:
- `public.profiles` table (linked to `auth.users`)
- Trigger that auto-creates a profile row when someone signs up
- `is_admin(uid)` helper function used across the schema
- Row-Level Security policies so users can only see their own profile
- Admin override policies so admins can manage all users

Verify it worked: go to Table Editor → you should see a `profiles` table with columns `id`, `email`, `full_name`, `role`, etc.

---

## Step 3 — Environment variables

Copy from the Supabase dashboard (Settings → API):

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...    # Keep this SECRET — never commit
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Used for password reset email links
```

In production (Vercel):
- Add the same env vars in Vercel Project Settings → Environment Variables
- Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://purex.fit`)

---

## Step 4 — Supabase auth configuration

In the Supabase dashboard:

### Auth Settings → URL Configuration
- **Site URL**: your production URL (or `http://localhost:3000` for dev)
- **Redirect URLs** (Whitelisted paths for auth redirects):
  - `http://localhost:3000/auth/callback` ← REQUIRED for password reset
  - `http://localhost:3000/auth/callback?**` ← Wildcard version (allow any ?next=...)
  - `http://localhost:3000/reset-password`
  - `http://localhost:3000/client/dashboard`
  - `https://purex.fit/auth/callback` (for production)
  - `https://purex.fit/auth/callback?**`
  - `https://purex.fit/reset-password`
  - `https://purex.fit/client/dashboard`

### Auth → Email Templates

Customize the 3 email templates to match the PURE X brand:
1. **Confirm signup** — new user verification
2. **Reset password** — password reset link
3. **Magic link** — (not used in Phase 2, safe to ignore)

At minimum, set the "From" name to "PURE X" in Auth → Settings.

### Auth → Providers
- **Email**: enabled by default ✓
- **Email confirmation**: recommended ON for production, can turn OFF for dev to skip the email verification step

---

## Step 5 — Run and test

```bash
npm install         # if not done
npm run dev
```

Visit:
- [localhost:3000/signup](http://localhost:3000/signup) → create a test account
- Check your inbox, click the confirmation link
- You'll land on [/client/dashboard](http://localhost:3000/client/dashboard) — protected by middleware
- Try [localhost:3000/login](http://localhost:3000/login) → logout → login flow

---

## Promoting a user to admin

Auth uses role-based access. New users default to `role = 'user'`. To make someone an admin:

### Option A — SQL
```sql
update public.profiles
set role = 'admin'
where email = 'admin@purex.fit';
```

### Option B — Supabase dashboard
Table Editor → `profiles` → find the row → edit `role` field → save

Admins can access `/admin/*` routes. The middleware checks role before rendering.

---

## What the middleware protects

`middleware.ts` runs on every request and enforces:

| Path pattern | Who can access |
|---|---|
| `/client/*` | Any authenticated user |
| `/admin/*` | Users with `role = 'admin'` or `'super_admin'` |
| `/login`, `/signup` | Unauthenticated only (signed-in users redirect to dashboard) |
| Everything else | Public |

Redirect-to-login includes the original path as a query param, so after login you land where you intended.

---

## How auth state is managed

**Client-side**: Supabase stores tokens in cookies. The session refreshes automatically on every page load via middleware.

**Server-side**: Server components use `createClient()` from `lib/supabase/server.ts` to read the session with `supabase.auth.getUser()`. This is secure — the token is verified on every call.

**Server actions**: Mutations (signIn, signOut, etc.) use the server client. They set cookies via the response, triggering a fresh session on the next navigation.

### Helper for protected pages

```tsx
// app/(client)/client/dashboard/page.tsx
import { requireAuth } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const user = await requireAuth();
  if (!user) redirect('/login');
  // ...
}
```

For admin pages:
```tsx
const user = await requireAuth({ adminOnly: true });
if (!user) redirect('/login');
```

But note: **middleware already handles this**, so `requireAuth()` in pages is belt-and-suspenders. Useful if you want to access the user object.

---

## The login/signup UI — the neon cord

The auth pages use a cinematic split-screen:
- **Left side**: dark gym scene with a gray dormant PURE X neon sign and hanging pull cord
- **Right side**: dimmed auth card

**On desktop**: the user must click the pull cord to "turn on" the scene. The neon sign ignites, ambient green floods the gym, dust motes appear, and the auth card illuminates.

**On mobile**: auto-activates after 400ms (UX consideration — no room for the pull-cord interaction on small screens).

The components are:
- `components/auth/GymScene.tsx` — dark wall + equipment silhouettes + ambient wash
- `components/auth/NeonPureXSign.tsx` — SVG letterforms with two render states
- `components/auth/PullCord.tsx` — the interactive cord
- `components/auth/AuthShell.tsx` — the orchestrating layout

---

## Troubleshooting

### "Auth session missing" errors
- Middleware isn't running → check `middleware.ts` is in the project root (not inside `app/`)
- Cookies blocked → check browser dev tools → Application → Cookies → should see `sb-*` cookies after login

### Email confirmation link doesn't work
- Check redirect URL is whitelisted in Supabase Auth → URL Configuration
- Confirm `NEXT_PUBLIC_SITE_URL` matches where the app is actually hosted

### Signup succeeds but profile row doesn't appear
- Trigger might not have been created → re-run the migration
- Check Supabase → Database → Triggers → should see `on_auth_user_created` on `auth.users`

### Middleware redirect loop
- Can happen if middleware conditions overlap → `/login` is checked to redirect signed-in users, but if the middleware isn't reading the session correctly, it might send you in circles. Check that `.env.local` keys are correct.

### Admin redirect doesn't work
- Make sure the user's `profiles.role` is actually `'admin'` (not `'Admin'` or `'ADMIN'` — case sensitive)
- Middleware reads the role from the DB, so a freshly-promoted user needs to sign out + back in to refresh their session

---

## Security checklist before production

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in Vercel secrets, NOT in any committed file
- [ ] Email confirmation is ON in Supabase
- [ ] Password minimum length is 8+ (enforced in `signUpSchema`)
- [ ] Redirect URLs whitelist only production domains
- [ ] Rate limiting enabled on auth endpoints (Supabase has this by default)
- [ ] RLS policies tested — try to read another user's profile, should fail
- [ ] Admin route protection tested — sign in as non-admin, try `/admin`, should redirect

Done. Users can now sign up, log in, reset passwords, and access protected client/admin routes.
