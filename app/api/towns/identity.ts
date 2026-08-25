import { cookies } from "next/headers";
import { getChatGPTUser } from "../../chatgpt-auth";

export type Viewer = {
  ownerId: string;
  ownerName: string;
  /** How we know who this is — useful for messaging, not for permissions. */
  source: "chatgpt" | "guest";
};

const GUEST_COOKIE = "bricklab_player";
const GUEST_MAX_AGE = 60 * 60 * 24 * 365 * 2;

/** Stable, non-reversible id — the raw email or guest token is never stored. */
export async function hashId(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(`bricklab:${value.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Who is asking, without creating anything.
 *
 * On OpenAI Sites the identity comes from the ChatGPT sign-in headers. Anywhere
 * else — Vercel included — a player is identified by a long random token in a
 * cookie their browser already holds. Returns null when there is neither, so
 * reads stay anonymous and writes can ask for an identity explicitly.
 */
export async function currentViewer(): Promise<Viewer | null> {
  const user = await getChatGPTUser();
  if (user) {
    return {
      ownerId: await hashId(`chatgpt:${user.email}`),
      ownerName: user.displayName.slice(0, 60),
      source: "chatgpt",
    };
  }
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token || token.length < 16) return null;
  return { ownerId: await hashId(`guest:${token}`), ownerName: "Guest builder", source: "guest" };
}

/**
 * Who is asking, minting a guest identity if they have none. Call this from
 * write handlers only — it sets a cookie, which a GET should not do.
 */
export async function ensureViewer(): Promise<Viewer> {
  const existing = await currentViewer();
  if (existing) return existing;

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const jar = await cookies();
  jar.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_MAX_AGE,
  });
  return { ownerId: await hashId(`guest:${token}`), ownerName: "Guest builder", source: "guest" };
}
