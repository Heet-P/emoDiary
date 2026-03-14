# emoDiary — Avatar & Live Lip Sync Feature Plan

## Overview

Users can customize a personal AI avatar (head only, colored accent) with a
custom name that hovers above it. The **Talk** page splits into a **50/50
screen** — the user's side on the left, the AI avatar on the right. When the
AI speaks, the avatar's mouth lip-syncs in real time using the **Web Audio API
amplitude** that already exists in the voice pipeline.

---

## What We Are Building

| # | Feature | Where |
|---|---------|--------|
| 1 | **Avatar Picker** — skin tone, head shape, hair color, accent ring color | `/settings` page |
| 2 | **Avatar Name** — custom label hovering above the AI avatar | `/settings` page |
| 3 | **DB Persistence** — avatar config stored in `profiles` table as JSON | Supabase / migration |
| 4 | **50/50 Split Talk Screen** — left = user panel, right = AI avatar | `talk/page.tsx` |
| 5 | **Live Lip Sync** — mouth animates with AI audio amplitude | `talk/page.tsx` (Web Audio API already wired) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Settings Page → Avatar Picker                           │
│    saves { skin, hair, headShape, accentColor, name }    │
│    → PUT /api/profile/avatar  →  profiles.avatar_config  │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Talk Page (50/50 split)                                 │
│  ┌───────────────────┐   ┌───────────────────┐          │
│  │  LEFT — User side │   │ RIGHT — AI Avatar │          │
│  │  User initials    │   │ SVG head avatar   │          │
│  │  "You"            │   │ "Aria" (hover)    │          │
│  │  voice visualizer │   │ 👄 lip sync anim  │          │
│  └───────────────────┘   └───────────────────┘          │
│  ────── Chat transcript below ─────────────────          │
└──────────────────────────────────────────────────────────┘
```

---

## Database

### Migration (add to Supabase SQL Editor)

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_config  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_name    TEXT  DEFAULT 'emoDiary';
```

`avatar_config` shape stored:
```json
{
  "skin":       "warm",
  "hair":       "black",
  "headShape":  "round",
  "accentColor": "#10b981"
}
```

---

## Backend Changes

### File: `backend/app/routers/profile.py` *(new file)*

Two endpoints:
- `GET /api/profile/avatar` — returns `avatar_config` + `avatar_name` from `profiles`
- `PUT /api/profile/avatar` — saves updated config to `profiles`

### File: `backend/app/main.py`

Register the new `profile_router`.

---

## Frontend Changes

### 1. Avatar SVG Component — `AvatarHead.tsx`

A pure SVG component that renders:
- A colored **circle head** with subtle shadow
- **Hair** (top arc, 3 color options)
- **Skin tint** fill
- **Accent ring** (outer glow using `accentColor` from config)
- **Mouth** — a small ellipse whose `ry` (vertical radius) is driven by a
  `lipSyncValue` prop (0.0 → 1.0 float)

The avatar name renders in a styled `<div>` positioned above the SVG with a
subtle fade-in badge.

### 2. Avatar Picker UI — inside `/settings` page

Small interactive panel:
- **Head shape** toggle: Round / Oval / Square-ish
- **Skin tone** swatches: 5 options (warm, cool, light, tan, deep)
- **Hair color** swatches: 5 options
- **Accent ring** color picker: 6 preset colors (using app's palette)
- **Name input**: text field, max 20 chars
- Live preview of `AvatarHead` updates as user picks options
- Save button → `PUT /api/profile/avatar`

### 3. Talk Page Redesign — `talk/page.tsx`

#### Layout change
Replace the current centered layout with a **2-column 50/50 split** (above the
transcript):

```
Left column:
  - User name / initials badge
  - VAD visualizer rings (existing animation, moved here)

Right column:
  - <AvatarHead> with stored config
  - Avatar name badge hovering on top
  - Lip sync driven by audio analyzer
```

#### Lip Sync Mechanism

The page already has `audioContextRef` and `currentAudioRef`. When AI audio
starts playing:

1. Connect `currentAudioRef` source to an `AnalyserNode`
2. Every animation frame: read `getByteTimeDomainData()` → compute RMS amplitude
3. Pass normalized amplitude (0–1) to `<AvatarHead lipSyncValue={amp}>`
4. The SVG mouth ellipse `ry` maps: `ry = 2 + amp * 10`
5. On audio end / state returns to `listening`: reset `lipSyncValue` to 0

No external library needed. Pure Web Audio API + CSS transition on the SVG.

---

## File Map

| Action | File |
|--------|------|
| NEW | `frontend/src/components/avatar/AvatarHead.tsx` |
| NEW | `frontend/src/components/avatar/AvatarPicker.tsx` |
| MODIFY | `frontend/src/app/(protected)/settings/page.tsx` |
| MODIFY | `frontend/src/app/(protected)/talk/page.tsx` |
| NEW | `backend/app/routers/profile.py` |
| MODIFY | `backend/app/main.py` |
| MODIFY | `backend/migration.sql` (append) |

---

## Verification Checklist

1. Settings → pick avatar → save → refresh → avatar persists
2. Talk → start session → AI replies → avatar mouth opens/closes with audio
3. Lip sync stops when audio ends (mouth closes)
4. Avatar name badge renders above the head on the right panel
5. Left/right columns are equal width on desktop, stack vertically on mobile
