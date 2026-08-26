import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Likes on the built-in showcase cities. */
export const cityLikes = sqliteTable("city_likes", {
  id: text("id").primaryKey(),
  cityId: text("city_id").notNull(),
  voterId: text("voter_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** A town a player built and saved to their account. */
export const towns = sqliteTable(
  "towns",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    ownerName: text("owner_name"),
    name: text("name").notNull(),
    data: text("data").notNull(),
    brickCount: integer("brick_count").notNull().default(0),
    thumb: text("thumb"),
    visibility: text("visibility").notNull().default("private"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("towns_owner_idx").on(table.ownerId),
    index("towns_public_idx").on(table.visibility, table.updatedAt),
  ],
);

/** Likes on player-built towns. */
export const townLikes = sqliteTable(
  "town_likes",
  {
    id: text("id").primaryKey(),
    townId: text("town_id").notNull(),
    voterId: text("voter_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("town_likes_town_idx").on(table.townId)],
);

/**
 * A note a player left while playing. Deliberately shallow: one row per note,
 * with whatever the game knew at the time in `context`, so nobody has to
 * remember which mode they were in or how far they had got.
 */
export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    game: text("game").notNull(),
    rating: integer("rating"),
    message: text("message").notNull(),
    context: text("context"),
    playerId: text("player_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("feedback_recent_idx").on(table.createdAt)],
);
