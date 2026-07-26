-- Ready Player Me 3D avatar URL — per-user .glb URL returned by
-- the RPM iframe builder when the client finishes creating their
-- Twin. Null until they complete the flow (or if their device
-- can't render 3D and they never bother).
--
-- The URL points at RPM's CDN (e.g.
-- https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb).
-- We only store the URL — the .glb file itself lives on RPM's
-- infra and is fetched by the client's browser at render time.
-- RPM's free tier is generous enough that we don't need to
-- proxy or self-host the assets in phase 1.
--
-- When a user re-runs the RPM builder (e.g. after weight loss to
-- reflect their new proportions) the URL is overwritten in-place.
-- We don't retain historical avatar URLs — the Future Clone
-- projection view is a live morphtarget interpolation, not a
-- historical record.

alter table public.profiles
  add column if not exists rpm_avatar_url text;

comment on column public.profiles.rpm_avatar_url is
  'Ready Player Me .glb URL for the user''s 3D avatar. Null if the user hasn''t completed the RPM builder or their device can''t render 3D.';
