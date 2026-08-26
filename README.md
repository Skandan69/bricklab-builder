# BrickLab Builder

BrickLab Builder is an original browser-based creative construction game. It includes guided building, free build, showcase cities, resident and railway views, a block-based open world, and claimable infinite plots.

## Playable routes

- `/` — Build Your Dream Cities landing page, guided build, free build, and showcase worlds
- `/worldforge.html` — Open World: claim plots, AI builders raise the structures, timed Frontier Gate expeditions
- `/frontier.html` — BrickLab Frontier: the settlement RPG on the chunked voxel engine (mining, crafting, quests, settlers, trade)
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

## Open World

`/worldforge.html` is the fourth game and the only one where you do not lay every
block yourself. Twelve claim beacons ring the map; press `E` on one and a named
AI builder occupies the plot and raises a whole structure over about eleven
seconds, block by block, which then persists in your save. What gets built is
decided by the trade the site is named for — `builderCraft()` maps a site id to a
Watchtower, Workshop, Glasshouse or Builder Lodge, so twelve plots are not one
plot twelve times.

There is no combat and no hunger. The pressure comes from land: `within()` is a
hard visible boundary you buy outward with coins, and `STAGE_CAP` ties how far it
can go to the settlement stage — Camp stops at 22, a Civilisation reaches 54. The
stage used to be a label on the HUD; it is now the thing coins are for.

The Frontier Gate is a two-minute round trip into a separate four-island zone with
a 24-item pack cap, a re-rolled ore distribution each run, and a rarity rule that
strips anything better than coal if the timer beats you back. Blocks you place
inside the isles are tagged `zone:'expedition'` so they cannot follow you home or
end up in your save.

`window.worldforge` exposes the world, the player, the claim sites and the
progression helpers, so the mode can be driven from tests the same way
`window.frontier` drives the RPG.

## Settlement tiers

The Frontier settlement grows out of what you build and who you help, not out of
a level number. `SETTLEMENT_TIERS` in `public/frontier.html` reads two counters —
blocks placed and settlement jobs delivered — and moves the settlement from Camp
to Hamlet to Village to Town. Each tier unlocks more of Arun's stock, which is
what gives frontier marks a purpose beyond the first stone pick.

Repeat settlement jobs pay `job.coins * 0.55^times`, floored at 3 marks. That is
deliberate: without it, any shop item that a job also consumes becomes an
infinite-money loop, since buying is cheaper than gathering.

## Browser saves

Current prototypes save player worlds, copied structures, occupied plots, and preferences in browser local storage. Clearing site data or changing browsers removes those local saves. Accounts and cloud persistence are planned for a later multiplayer sprint.

## Intellectual property

BrickLab is an original construction game prototype. Do not add third-party trademarks, character designs, music, textures, or other assets without appropriate rights.
