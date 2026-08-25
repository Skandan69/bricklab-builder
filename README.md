# BrickLab Builder

BrickLab Builder is an original browser-based creative construction game. It includes guided building, free build, showcase cities, resident and railway views, a block-based open world, and claimable infinite plots.

## Playable routes

- `/` — Build Your Dream Cities landing page, guided build, free build, and showcase worlds
- `/worldforge.html` — BrickLab Frontier open-world building mode
- `/infinite-plots.html` — claimable 48 × 48 plots with Open World structure import
- `/brickforge.html` — the 3D construction engine used by the city builder

## Included source

- `app/` — Next.js interface and API routes
- `public/` — 3D game modes, Three.js runtime, showcase images, and world blueprints
- `db/` and `drizzle/` — Cloudflare D1 likes schema and migration
- `tests/` — rendered-page and feature-regression checks
- `docs/BRICKLAB_PRODUCT_ROADMAP.md` — planned gameplay milestones

## Requirements

- Node.js 22.13 or newer
- npm

## Run locally

```bash
npm ci
npm run dev
```

Then open the local address shown in the terminal.

## Validate

```bash
npm run lint
npm test
```

## Deployment

The same repository supports two deployment targets:

- OpenAI Sites/Cloudflare: `npm run build`
- Vercel/Next.js: `npm run build:vercel`

`vercel.json` selects the native Next.js build automatically on Vercel. Cloudflare uses D1 for shared city likes. The Vercel build uses a best-effort in-memory likes adapter until a persistent Vercel-compatible database is connected; the construction games and browser saves remain fully available.

## Browser saves

Current prototypes save player worlds, copied structures, occupied plots, and preferences in browser local storage. Clearing site data or changing browsers removes those local saves. Accounts and cloud persistence are planned for a later multiplayer sprint.

## Intellectual property

BrickLab is an original construction game prototype. Do not add third-party trademarks, character designs, music, textures, or other assets without appropriate rights.
