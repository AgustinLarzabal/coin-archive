import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const coin = pgTable("coin", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
}, (coin) => [
  index("coin_recent_created_at_id_idx").on(
    coin.createdAt.desc(),
    coin.id.desc(),
  ),
]);
