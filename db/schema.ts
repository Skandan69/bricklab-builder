import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cityLikes = sqliteTable("city_likes", {
  id: text("id").primaryKey(),
  cityId: text("city_id").notNull(),
  voterId: text("voter_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
