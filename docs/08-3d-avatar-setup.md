# 3D Avatar Setup

The Digital Twin feature renders a 3D character using Three.js. You need a **GLB file** placed at `public/models/avatar.glb` for it to show up. This doc walks you through the best free sources.

## Quick setup (2 minutes)

### Option 1 — Khronos Sample Avatar (easiest)

1. Go to https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan/glTF-Binary
2. Click the file `CesiumMan.glb`
3. Click "Download raw file" (the download icon on the right)
4. Rename the file to `avatar.glb`
5. Move it into `public/models/avatar.glb` in your project

Done. Refresh the Twin page and the character appears.

**What it looks like:** An animated walking figure. Not fitness-themed but it's a full rigged humanoid that works perfectly with the viewer.

### Option 2 — Sketchfab (best for realistic avatars)

1. Go to https://sketchfab.com
2. Search for "avatar" or "character" and filter:
   - Downloadable: Yes
   - License: CC Attribution / CC0
3. Click a character you like
4. Click Download → choose **glTF (.glb)** format
5. Rename to `avatar.glb` and place in `public/models/`

**Recommended searches:**
- `rigged character free`
- `stylized avatar`
- `humanoid base mesh`
- `athletic character`

### Option 3 — Meshy AI (custom brand avatar)

Meshy generates custom 3D avatars from text prompts. Great for getting a PURE X-specific character.

1. Go to https://www.meshy.ai
2. Sign up (free tier includes 200 credits/month)
3. Use "Text to 3D" and enter a prompt like:
   - `athletic fitness coach, confident pose, realistic, lime green accents`
   - `strong hybrid athlete, standing tall, gym attire, photorealistic`
4. Download the generated GLB file
5. Rename to `avatar.glb` and place in `public/models/`

### Option 4 — Mixamo (free rigged characters)

Adobe Mixamo has ~50 free rigged humanoid characters.

1. Go to https://www.mixamo.com (requires free Adobe account)
2. Browse characters → pick one
3. Download → format: "FBX for Unity" or "glTF"
4. If you get an FBX, convert it to GLB using https://products.aspose.app/3d/conversion/fbx-to-glb
5. Rename to `avatar.glb` and place in `public/models/`

### Option 5 — Commission a custom character ($150-400)

For a brand-matched character:
- **Fiverr:** Search "3D character modeling glb"
- **Upwork:** Post a job for "fitness athlete 3D avatar"
- **ArtStation:** Contact 3D character artists directly

Request specifications:
- Format: GLB
- Poly count: <50K (for web performance)
- Rigged: Yes (humanoid rig)
- Textures: PBR embedded
- Style: Match your reference image

## Directory structure

```
public/
└── models/
    ├── avatar.glb              ← The main character (required)
    ├── avatar-projected.glb    ← Optional: different Day-100 model
    └── avatar-female.glb       ← Optional: alternative character
```

## File size guidelines

- **Under 5MB**: Ideal for fast loading
- **5-10MB**: OK but noticeable first load
- **Over 10MB**: Too large — compress with https://rapidcompact.com or gltfpack

## To use multiple avatars

By default, both "current" and "projected" viewers load `/models/avatar.glb`. To use different models:

Edit `app/(client)/client/twin/page.tsx`:

```tsx
<TwinViewer3DLazy
  avatarUrl="/models/avatar-day-0.glb"
  variant="current"
  height={420}
/>
<TwinViewer3DLazy
  avatarUrl="/models/avatar-day-100.glb"
  variant="projected"
  height={420}
/>
```

## Fallback behavior

If `avatar.glb` is missing, the viewer shows a clean fallback with instructions — no crashes, no broken UI. You can ship without the file and add it whenever you're ready.

## Testing your GLB file

Before placing a GLB in your project, preview it at:
- https://gltf-viewer.donmccurdy.com (drag & drop)
- https://glb.ee (same, different viewer)

If it looks right there, it'll work in PURE X.
