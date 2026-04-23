# In Action Gallery Photos

Drop your 9 PORTRAIT photos here with EXACT filenames below.

## Grid layout (3x3, all same size)

```
┌───┬───┬───┐
│01 │02 │03 │   Row 1
├───┼───┼───┤
│04 │05 │06 │   Row 2
├───┼───┼───┤
│07 │08 │09 │   Row 3
└───┴───┴───┘
```

All tiles are equal size, portrait (3:4 aspect ratio — taller than wide).
Grid goes 3 columns on desktop → 2 on tablet → 1 stack on mobile.

## Required files

| Filename              | Position    | Suggested content            |
|-----------------------|-------------|------------------------------|
| `in-action-01.jpg`    | Top-left    | Heavy lift                   |
| `in-action-02.jpg`    | Top-center  | Cardio / Zone 2              |
| `in-action-03.jpg`    | Top-right   | Sled push                    |
| `in-action-04.jpg`    | Mid-left    | Mobility / warmup            |
| `in-action-05.jpg`    | Mid-center  | Your strongest photo         |
| `in-action-06.jpg`    | Mid-right   | Olympic lift                 |
| `in-action-07.jpg`    | Bot-left    | Metcon / conditioning        |
| `in-action-08.jpg`    | Bot-center  | Sprint / running             |
| `in-action-09.jpg`    | Bot-right   | Recovery                     |

## Photo specs

- **Aspect ratio: 3:4 PORTRAIT** (examples: 600x800, 900x1200, 750x1000)
  - Photos that are slightly different portrait ratios (2:3, 4:5) will still work — `object-cover` crops to fit the slot
- **Format**: JPEG or WebP (WebP is ~30% smaller, same quality)
- **File size**: Under 300KB each — compress with tinyjpg.com or squoosh.app
- **Total**: all 9 photos should stay under ~2MB combined

## What happens if a photo is missing?

Each tile falls back to a dark gradient with just the label visible — looks
clean next to real photos. Mix of real + placeholders is totally fine.

## Editing labels

The green caption label on each tile ("Deadlift", "Zone 2", etc.) is defined
in the `PHOTOS` array at:
`components/marketing/sections/InActionGallery.tsx`

Edit the `label` field of any photo to change what shows in the overlay.
