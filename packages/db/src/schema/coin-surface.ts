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

export const coinSurfaceKinds = [
  "obverse",
  "reverse",
  "edge-surface",
] as const
export type CoinSurfaceKind = (typeof coinSurfaceKinds)[number]
const coinSurfaceKindsSql = sql.raw(
  `(${coinSurfaceKinds.map((kind) => `'${kind}'`).join(", ")})`
)

export const coinSurfaceSchemaNames = {
  coinIdIndex: "coin_surface_coin_id_idx",
  idKindUniqueIndex: "coin_surface_id_kind_unique_idx",
  kindCheck: "coin_surface_kind_check",
  kindUniqueIndex: "coin_surface_coin_id_kind_unique_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const coinSurface = pgTable(
  "coin_surface",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coin.id, {
        onDelete: "cascade",
      }),
    kind: varchar("kind", { length: 16 }).$type<CoinSurfaceKind>().notNull(),
    description: varchar("description", { length: 2000 }),
    lettering: varchar("lettering", { length: 4000 }),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (coinSurface) => [
    uniqueIndex(coinSurfaceSchemaNames.kindUniqueIndex).on(
      coinSurface.coinId,
      coinSurface.kind
    ),
    uniqueIndex(coinSurfaceSchemaNames.idKindUniqueIndex).on(
      coinSurface.id,
      coinSurface.kind
    ),
    index(coinSurfaceSchemaNames.coinIdIndex).on(coinSurface.coinId),
    check(
      coinSurfaceSchemaNames.kindCheck,
      sql`${coinSurface.kind} in ${coinSurfaceKindsSql}`
    ),
  ]
)

export type CoinSurface = typeof coinSurface.$inferSelect
