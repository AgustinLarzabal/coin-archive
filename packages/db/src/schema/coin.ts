import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const coinRecentCreatedAtIdIndexName = "coin_recent_created_at_id_idx";

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const;

export const coin = pgTable("coin", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", timestamptzDateColumn)
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", timestamptzDateColumn)
    .notNull()
    .defaultNow(),
}, (coin) => [
  index(coinRecentCreatedAtIdIndexName).on(
    coin.createdAt.desc(),
    coin.id.desc(),
  ),
]);
