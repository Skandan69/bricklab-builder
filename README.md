# BrickLab Builder

BrickLab Builder is an original browser-based creative construction game. It includes guided building, free build, showcase cities, resident and railway views, a block-based open world, and claimable infinite plots.

## Playable routes

- `/` — Build Your Dream Cities landing page, guided build, free build, and showcase worlds
- `/worldforge.html` — BrickLab Frontier open-world building mode
- `/frontier.html` — Deep World: the chunked voxel engine (endless terrain, mining, crafting, survival)
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

## Deep World engine

`/frontier.html` is a separate open-world mode built on a proper voxel engine:
16×96×16 chunks in typed arrays, meshing that emits only the faces touching air,
value-noise terrain with biomes, caves and ore veins, and chunks streaming in and
out around the player. Mining uses block hardness and tool tiers; there is a
crafting tree from logs to iron tools, a day/night cycle, health, food and fall
damage. Worlds save as a seed plus the blocks the player changed, so a save is
kilobytes rather than megabytes.

A frontier is finite, as the roadmap intends: land stops at a visible edge and
expands only when earned (free during Early Builder Access). Three named world
slots with autosave, a recovery copy of the previous save, and JSON import and
export. Pressing `M` opens a territory map with fog of discovery — ground stays
dark until you walk it. Creatures are original: grublings surface after dark,
stone-biters live in the caves, meadow hoppers graze by day and are the food
supply; torches suppress spawning nearby.

This covers the OW Sprint 3 exit criteria — a stable, performant, finite
territory — on top of the engine, which is the Open World creative alpha gate.

It is deliberately original: no third-party textures, sounds, creature designs,
names or terminology. The genre is shared; the assets and wording are ours.

## Saved towns

`app/api/towns/` stores a player's cities on the server so they survive a cleared
cache or a different browser, and can be shared by link or listed publicly.

- `db/client.ts` picks the database for whichever target is running: Turso/libSQL
  when `TURSO_DATABASE_URL` is set (this is what Vercel uses), Cloudflare D1
  otherwise, and answers `503` with a one-line explanation when neither is
  configured — so the site still runs with no database at all.
- Identity comes from the ChatGPT sign-in headers on OpenAI Sites, and from a long
  random token in an `httpOnly` cookie anywhere else. Owner ids are SHA-256 hashes;
  the raw email or token is never stored. Swapping in real accounts later means
  changing `app/api/towns/identity.ts` and nothing else.
- Limits: 20,000 pieces and 1.5 MB of JSON per town, which is D1's 2 MB row cap
  with headroom.

Set it up with `.env.example` and `npm run db:migrate`. See
`docs/saved-towns.md` for the full route reference.

## Browser saves

Current prototypes save player worlds, copied structures, occupied plots, and preferences in browser local storage. Clearing site data or changing browsers removes those local saves. Accounts and cloud persistence are planned for a later multiplayer sprint.

## Intellectual property

BrickLab is an original construction game prototype. Do not add third-party trademarks, character designs, music, textures, or other assets without appropriate rights.
