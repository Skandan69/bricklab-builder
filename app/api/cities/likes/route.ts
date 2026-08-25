import { and, count, eq } from "drizzle-orm";
import { cityLikes } from "../../../../db/schema";

const clean = (value: unknown, max = 80) => typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value) ? value.slice(0, max) : "";

type MemoryLikes = Map<string, Set<string>>;
const memoryLikes = () => {
  const root = globalThis as typeof globalThis & { __bricklabLikes?: MemoryLikes };
  return root.__bricklabLikes ??= new Map<string, Set<string>>();
};

async function getCloudflareDb() {
  const { getDb } = await import("../../../../db");
  return getDb();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cityId = clean(url.searchParams.get("cityId"));
  const voterId = clean(url.searchParams.get("voterId"));
  if (!cityId) return Response.json({error:"cityId is required"},{status:400});
  if (process.env.VERCEL) {
    const voters = memoryLikes().get(cityId) ?? new Set<string>();
    return Response.json({count:voters.size,liked:voterId ? voters.has(voterId) : false});
  }
  const db = await getCloudflareDb();
  const [{value}] = await db.select({value:count()}).from(cityLikes).where(eq(cityLikes.cityId,cityId));
  const liked = voterId ? (await db.select({id:cityLikes.id}).from(cityLikes).where(and(eq(cityLikes.cityId,cityId),eq(cityLikes.voterId,voterId))).limit(1)).length > 0 : false;
  return Response.json({count:value,liked});
}

export async function POST(request: Request) {
  const body = await request.json() as {cityId?:unknown;voterId?:unknown;liked?:unknown};
  const cityId = clean(body.cityId); const voterId = clean(body.voterId);
  if (!cityId || !voterId || typeof body.liked !== "boolean") return Response.json({error:"Invalid like request"},{status:400});
  if (process.env.VERCEL) {
    const likes = memoryLikes();
    const voters = likes.get(cityId) ?? new Set<string>();
    if (body.liked) voters.add(voterId); else voters.delete(voterId);
    likes.set(cityId, voters);
    return Response.json({count:voters.size,liked:body.liked});
  }
  const db = await getCloudflareDb(); const id = `${cityId}:${voterId}`;
  if (body.liked) await db.insert(cityLikes).values({id,cityId,voterId}).onConflictDoNothing();
  else await db.delete(cityLikes).where(eq(cityLikes.id,id));
  const [{value}] = await db.select({value:count()}).from(cityLikes).where(eq(cityLikes.cityId,cityId));
  return Response.json({count:value,liked:body.liked});
}
