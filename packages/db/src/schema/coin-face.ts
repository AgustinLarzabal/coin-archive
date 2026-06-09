import { sql } from "drizzle-orm"
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { coin } from "./coin"

export const coinFaceSides = ["obverse", "reverse"] as const
export type CoinFaceSide = (typeof coinFaceSides)[number]

export const coinFaceSchemaNames = {
  coinIdIndex: "coin_face_coin_id_idx",
  sideCheck: "coin_face_side_check",
  sideUniqueIndex: "coin_face_coin_id_side_unique_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const coinFace = pgTable(
  "coin_face",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coin.id, {
        onDelete: "cascade",
      }),
    side: varchar("side", { length: 16 }).$type<CoinFaceSide>().notNull(),
    description: varchar("description", { length: 2000 }),
    lettering: varchar("lettering", { length: 4000 }),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (coinFace) => [
    uniqueIndex(coinFaceSchemaNames.sideUniqueIndex).on(
      coinFace.coinId,
      coinFace.side
    ),
    index(coinFaceSchemaNames.coinIdIndex).on(coinFace.coinId),
    check(
      coinFaceSchemaNames.sideCheck,
      sql`${coinFace.side} in ('obverse', 'reverse')`
    ),
  ]
)

export type CoinFace = typeof coinFace.$inferSelect
