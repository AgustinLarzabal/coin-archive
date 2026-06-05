import { sql } from "drizzle-orm"
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { distribution } from "./distribution"
import { issuer } from "./issuer"

const coinRecentCreatedAtIdIndexName = "coin_recent_created_at_id_idx"
const coinIssuerIdIndexName = "coin_issuer_id_idx"
const coinDistributionIdIndexName = "coin_distribution_id_idx"

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const coin = pgTable(
  "coin",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    title: varchar("title", { length: 255 }).notNull(),
    issuerId: uuid("issuer_id")
      .notNull()
      .references(() => issuer.id, {
        onDelete: "restrict",
      }),
    distributionId: uuid("distribution_id")
      .notNull()
      .references(() => distribution.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (coin) => [
    index(coinRecentCreatedAtIdIndexName).on(
      coin.createdAt.desc(),
      coin.id.desc()
    ),
    index(coinIssuerIdIndexName).on(coin.issuerId),
    index(coinDistributionIdIndexName).on(coin.distributionId),
  ]
)

export type Coin = typeof coin.$inferSelect
