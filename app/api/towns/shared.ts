export { currentViewer, ensureViewer, hashId } from "./identity";
export type { Viewer } from "./identity";

/** D1 caps a single value at 2 MB; leave headroom for the rest of the row. */
export const MAX_DATA_BYTES = 1_500_000;
export const MAX_THUMB_BYTES = 140_000;
export const MAX_BRICKS = 20_000;
export const LIST_LIMIT = 24;
export const VISIBILITIES = ["private", "unlisted", "public"] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export function newTownId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes)
    .map((b) => (b % 36).toString(36))
    .join("");
}

export const isTownId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9]{6,24}$/i.test(value);

export const isVoterId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{4,80}$/.test(value);

export function cleanName(value: unknown, fallback = "Untitled town"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 60);
  return trimmed || fallback;
}

export function cleanVisibility(value: unknown, fallback: Visibility = "private"): Visibility {
  return (VISIBILITIES as readonly string[]).includes(value as string)
    ? (value as Visibility)
    : fallback;
}

export function cleanThumb(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return null;
  return value.length > MAX_THUMB_BYTES ? null : value;
}

/** Accepts the object window.brickforge.exportTown() returns. */
export function checkTownData(
  value: unknown,
):
  | { ok: true; text: string; bricks: number }
  | { ok: false; error: string; status: 400 | 413 } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Town data must be an object", status: 400 };
  }
  const bricks = (value as { bricks?: unknown }).bricks;
  if (!Array.isArray(bricks)) {
    return { ok: false, error: "Town data has no bricks array", status: 400 };
  }
  if (bricks.length > MAX_BRICKS) {
    return { ok: false, error: `Towns are limited to ${MAX_BRICKS} pieces`, status: 413 };
  }
  const text = JSON.stringify(value);
  const size = new TextEncoder().encode(text).length;
  if (size > MAX_DATA_BYTES) {
    return { ok: false, error: "This town is too large to save (over 1.5 MB)", status: 413 };
  }
  return { ok: true, text, bricks: bricks.length };
}

export const fail = (error: string, status: number) => Response.json({ error }, { status });

export const needSignIn = () =>
  Response.json(
    { error: "We could not identify this browser, so the town was not saved.", signInPath: "/signin-with-chatgpt" },
    { status: 401 },
  );
