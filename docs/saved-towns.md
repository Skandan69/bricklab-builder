# Saved towns

Players used to keep towns in their own browser only. They now save to the site's
D1 database, so a town survives a cleared cache, opens on another device, and can
be shared with a link.

## Database

`db/schema.ts` adds two tables, created by `drizzle/0001_towns.sql`:

- **`towns`** — `id`, `owner_id`, `owner_name`, `name`, `data` (the town JSON),
  `brick_count`, `thumb` (small JPEG data URL), `visibility`, `created_at`,
  `updated_at`. Indexed on `owner_id` and on `(visibility, updated_at)` so the
  gallery query never scans the table.
- **`town_likes`** — one row per `(town, voter)`, indexed on `town_id`.

`owner_id` is a SHA-256 hash of the signed-in ChatGPT email, not the address
itself, so the table holds no contact details. `owner_name` is the display name
shown on gallery cards.

Apply the migration the same way as `0000`; regenerate later ones with
`npm run db:generate` after editing `db/schema.ts`.

## API

| Route | Method | Who | Does |
| --- | --- | --- | --- |
| `/api/towns?scope=public\|mine` | GET | anyone / owner | Gallery cards (no town payload) with like counts |
| `/api/towns` | POST | signed in | Create a town, or update one you own by passing `id` |
| `/api/towns/:id` | GET | anyone, unless private | Full town JSON for loading into the builder |
| `/api/towns/:id` | PATCH | owner | Rename, change visibility, replace thumbnail or data |
| `/api/towns/:id` | DELETE | owner | Remove the town and its likes |
| `/api/towns/:id/like` | GET, POST | anyone | Read or toggle a like |

Visibility is `private` (owner only), `unlisted` (anyone with the link) or
`public` (appears in the gallery). Writes require ChatGPT sign-in and return
`401` with a `signInPath` when the visitor is anonymous; likes only need the
browser-generated `voterId`.

Limits: 20,000 pieces and 1.5 MB of JSON per town — D1 caps a single value at
2 MB. Past that, switch `data` to an R2 object and store the key here instead
(`.openai/hosting.json` currently has `"r2": null`).

## In the builder

`public/brickforge.html` exposes three extra functions on `window.brickforge`:

- `exportTown()` — the current town as a plain object (bakes physics first)
- `importTown(data)` — load one back
- `snapshot(width)` — a downscaled JPEG data URL for the gallery thumbnail

`app/TownBar.tsx` is the bar across the bottom of the builder that uses them:
name, visibility, Save/Update, Share (copies a `?town=<id>` link), My towns and
Community. Opening the site with `?town=<id>` loads that town automatically once
the builder is ready.

## Known gap

`vite.config.ts` imports `./build/sites-vite-plugin`, and there is no `build/`
directory in this checkout, so `npm run dev` will fail until it is restored from
the original project. It is not in `.gitignore`, so it went missing from the
extract rather than being generated.
