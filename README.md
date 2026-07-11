# Lark 💙💗

A **2‑player, mobile‑web couples adventure** built with Next.js + react‑three‑fiber, set in a stylized 3D city generated from **real OpenStreetMap data**. Off on a lark — explore a city together.

Two ways to play:

- **💗 Reunite** — you spawn apart; a compass points toward your partner. Get within 8&nbsp;m to reunite.
- **🏁 Landmark Rush** — split up and collectively find every landmark before a shared 5‑minute timer runs out.

The whole game is a **static site** (no server) — realtime co‑op runs over **Supabase Realtime**. It deploys to **GitHub Pages via GitHub Actions**: push to `main`, and the shared play URL updates automatically.

**▶ Play:** https://Akash-M.github.io/lark/ *(live a minute after the first deploy finishes)*

---

## The workflow: iterate, then sync

1. Iterate on the game in the assistant thread.
2. Changes are pushed to this repo.
3. GitHub Actions builds and deploys to Pages automatically.
4. Refresh the URL — the new version is live for both of you.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # paste Supabase keys (optional, for multiplayer)
npm run dev                        # → http://localhost:3000
```

Without Supabase keys it still runs as a **single‑player preview** so you can walk the city and try both modes solo.

## Deploy setup (once)

1. **Enable Pages via Actions:** the workflow enables it automatically on its first run. If it doesn't, go to **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. **(Optional) Multiplayer:** add two **repository secrets** under
   **Settings → Secrets and variables → Actions → New repository secret**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Get them from a free project at https://app.supabase.com → **Project Settings → API**.
   (No database setup needed — these modes use Realtime only. The anon key is safe to expose publicly.)
3. Push to `main` (or run the workflow from the **Actions** tab). When it finishes, the URL above is live.

> The repo must be **public** for GitHub Pages on a free plan.

## Test co‑op

Open the URL on two phones/browsers, enter the **same room code**, and pick a mode from either device.

---

## Project layout

```
.github/workflows/deploy.yml   CI: build static export + deploy to Pages
src/data/munich.json           Baked OSM district (204 buildings) + curated landmarks
src/lib/                       Supabase client, zustand store, realtime room hook, types
src/game/                      3D layer: city mesh, avatars, player, remote players, landmarks
src/ui/                        DOM overlays: joystick, reunite compass, HUD
fetch_osm.py                   Regenerate a city district from any OSM bounding box
```

## Add another city

1. Run `fetch_osm.py` with a new bounding box to produce `<city>.json`.
2. Add curated `landmarks` and drop it in `src/data/<city>.json`.
3. Register it in `src/lib/cities.ts`.

## Tech

Next.js 14 (App Router, static export) · react‑three‑fiber + three.js · Supabase Realtime (Presence + Broadcast) · zustand.

City data © OpenStreetMap contributors (ODbL).
