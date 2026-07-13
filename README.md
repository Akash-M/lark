# Lark 💙💗

A **2‑player, mobile‑web couples adventure** built with Next.js + react‑three‑fiber, set in a stylized 3D city generated from **real OpenStreetMap data**. Off on a lark — explore a city together.

Two ways to play:

- **💗 Reunite** — you spawn apart; a compass points toward your partner. Get within 8&nbsp;m to reunite.
- **🏁 Landmark Rush** — split up and collectively find every landmark before a shared 5‑minute timer runs out.

The whole game is a client‑side app; realtime co‑op runs over **Supabase Realtime**. It's deployed on **Vercel** (native Git integration) — every push to `main` auto‑deploys.

**▶ Play:** your Vercel production URL (e.g. `https://lark.vercel.app`)

---

## The workflow: iterate, then sync

1. Iterate on the game in the assistant thread.
2. Changes are pushed to this repo's `main`.
3. Vercel auto‑builds and deploys.
4. Refresh the URL — the new version is live for both of you.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # paste Supabase keys (see below)
npm run dev                        # → http://localhost:3000
```

Without Supabase keys it still runs as a **single‑player preview** so you can walk the city and try both modes solo.

## Configure Supabase (multiplayer)

These modes use **Supabase Realtime only** — Broadcast (live positions + game events) and Presence (who's in the room). **No database tables, no auth, no RLS policies to set up.**

1. Create a free project at https://app.supabase.com.
2. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
3. Local: put them in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```
4. Vercel: **Project → Settings → Environment Variables** → add the same two vars to the **Production** (and Preview) environments → **redeploy** (they're baked in at build time).

That's it — both players enter the **same room code** and they're synced. The anon key is safe to expose; it's designed for browser use, and these public channels need nothing more.

## Deploy on Vercel (native)

The repo is already wired for Vercel — it builds Next natively and serves at the domain root. Just make sure:

- **Vercel → Project → Settings → Git** is connected to `Akash-M/lark` (auto‑deploy on push to `main`).
- The two Supabase env vars above are set for **Production**.

Push to `main` (or click **Redeploy** in Vercel) and your URL goes live.

> **GitHub Pages alternative:** set `STATIC_EXPORT=1` and `NEXT_PUBLIC_BASE_PATH=/lark` at build time to emit a static `./out` for Pages. Not needed for Vercel.

## Test co‑op

Open the URL on two phones/browsers, enter the **same room code**, and pick a mode from either device.

---

## Project layout

```
src/data/munich.json   Baked OSM district (204 buildings) + curated landmarks
src/lib/               Supabase client, zustand store, realtime room hook, types
src/game/              3D layer: city mesh, avatars, player, remote players, landmarks
src/ui/                DOM overlays: joystick, reunite compass, HUD
fetch_osm.py           Regenerate a city district from any OSM bounding box
```

## Add another city

1. Run `fetch_osm.py` with a new bounding box to produce `<city>.json`.
2. Add curated `landmarks` and drop it in `src/data/<city>.json`.
3. Register it in `src/lib/cities.ts`.

## Tech

Next.js 14 (App Router) · react‑three‑fiber + three.js · Supabase Realtime (Presence + Broadcast) · zustand.

City data © OpenStreetMap contributors (ODbL).
