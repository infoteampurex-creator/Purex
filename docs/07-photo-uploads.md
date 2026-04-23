# PURE X — Photo Uploads Setup (Phase 2)

Private photo storage for client avatars and transformation photos.

## What this enables

- **Profile avatars** — admin uploads a headshot for each client (or client uploads their own)
- **Progress photos** — front/side/back body shots per check-in date
- All files stored in **private** Supabase Storage buckets
- Access gated by RLS: clients see only their own files, admins see all
- Photos rendered via **short-lived signed URLs** (1 hour) for privacy

---

## Setup — 3 steps

### 1. Run migration `00003_storage_buckets.sql`

In Supabase SQL Editor:

```sql
-- Paste contents of supabase/migrations/00003_storage_buckets.sql
```

This creates two buckets (`client-avatars`, `client-progress`) and the RLS policies.

### 2. Verify buckets exist

- Go to Supabase Dashboard → **Storage** (left sidebar)
- You should see two buckets: `client-avatars` and `client-progress`
- Both should show "Private" (lock icon)
- If they don't exist, re-run the migration

### 3. Test the upload

- Sign in as admin → go to `/admin/clients/c1` (Arjun)
- **Hover over the avatar** — click-to-upload icon appears
- Click → file picker → choose a JPEG/PNG/WebP under 5MB
- Should upload, photo appears, avatar updates across the admin area
- **Photos tab** — drag-drop or click any of the 3 slots (Front/Side/Back) to upload transformation photos

---

## File paths

Files are organized for easy management:

```
client-avatars/
  <client_id>/
    avatar.jpg       ← always replaces (upsert)

client-progress/
  <client_id>/
    2026-02-15/      ← check-in date
      front.jpg
      side.jpg
      back.jpg
    2026-03-15/
      front.jpg
      ...
```

Client IDs come from `public.profiles.id` (same as `auth.users.id`).

---

## RLS policies explained

### Client-avatars bucket
- **Clients**: can upload/read/delete their OWN avatar (path starts with their `auth.uid()`)
- **Admins**: can upload/read/delete ANY avatar

### Client-progress bucket
- Same pattern: clients manage their own folder, admins manage everything

The key check is `(storage.foldername(name))[1] = auth.uid()::text` — this means "the first folder segment of the file path must equal my user ID."

---

## Validation rules

Enforced both client-side (immediate feedback) and server-side (security):

- **Allowed types**: `image/jpeg`, `image/png`, `image/webp`
- **Max size**: 5 MB
- **Min size**: > 0 bytes
- Paths validated: date format `YYYY-MM-DD`, view must be `front` | `side` | `back`

---

## Signed URLs

Photos are private, so they're served via **signed URLs** that expire in 1 hour.

```ts
import { getSignedPhotoUrl } from '@/lib/supabase/storage';

// In a server component:
const url = await getSignedPhotoUrl('client-avatars', client.avatarUrl);
// url is now a full https://... URL that works for 1 hour
```

For efficient batch signing:

```ts
import { getSignedPhotoUrls } from '@/lib/supabase/storage';

const [frontUrl, sideUrl, backUrl] = await getSignedPhotoUrls(
  'client-progress',
  [photoSet.frontPath, photoSet.sidePath, photoSet.backPath]
);
```

---

## How uploads work end-to-end

1. User clicks photo slot in browser → file picker opens
2. Select file → client-side validation (type, size)
3. Local preview shown immediately via `URL.createObjectURL()`
4. FormData sent to server action (`uploadProgressPhoto` or `uploadClientAvatar`)
5. Server action:
   - Re-validates (never trust the client)
   - Authorizes (must be admin OR self)
   - Uploads to Supabase Storage with `upsert: true` (replaces existing)
   - Updates `profiles.avatar_url` OR `client_progress_logs.<view>_photo_url`
   - Revalidates the page cache so new photo appears immediately
6. Success checkmark → returns to idle state

---

## Troubleshooting

### "Upload failed: Failed to fetch" or 403 errors
- Check RLS policies exist — re-run migration
- Verify you're signed in as admin (check `/admin/clients` loads)
- Open browser DevTools → Network → look at the failing request

### Photos appear broken / 404
- Signed URL expired (>1 hour) — refresh the page
- File was deleted from storage but URL still in DB — check bucket directly

### "File type not allowed"
- Only JPEG, PNG, WebP allowed. Reject HEIC (iPhone), AVIF, etc.
- If you need HEIC support, use a client-side conversion library

### Storage bucket not found
- Buckets are auto-created by the migration. If the migration failed:
- Dashboard → Storage → **New Bucket** → create both buckets manually as "Private"

---

## Storage quota & costs

Supabase free tier includes:
- 1 GB of storage
- 2 GB bandwidth/month
- 5 MB max file size (enforced by us anyway)

For a real deployment with photos:
- ~500 KB per photo (compressed JPEG)
- 4 photos per check-in × 2 check-ins per month per client × 50 clients = **400 photos/month, ~200 MB/year**
- Well within free tier for first year

Upgrade to Pro ($25/month) gets you 100 GB storage + 200 GB bandwidth.

---

## Next steps

- [ ] Add image compression on upload (reduce file sizes before sending)
- [ ] Support HEIC conversion (iPhone photos)
- [ ] Add a "delete photo" action in the UI (backend already exists via `deleteProgressPhoto`)
- [ ] Add lightbox viewer for full-size photo preview
- [ ] Add side-by-side comparison view (baseline vs latest)
