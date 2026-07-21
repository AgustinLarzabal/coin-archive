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
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { coin } from "./coin"

export const engraverSurfaceKinds = ["obverse", "reverse"] as const
export type EngravableCoinSurfaceKind =
  (typeof engraverSurfaceKinds)[number]
export const coinSurfaceKinds = [...engraverSurfaceKinds, "edge-surface"] as const
export type CoinSurfaceKind = (typeof coinSurfaceKinds)[number]
const coinSurfaceKindsSql = sql.raw(
  `(${coinSurfaceKinds.map((kind) => `'${kind}'`).join(", ")})`
)

export const coinSurfaceSchemaNames = {
  imageUrlWebUrlCheck: "coin_surface_image_url_web_url_check",
  coinIdIndex: "coin_surface_coin_id_idx",
  idKindUniqueIndex: "coin_surface_id_kind_unique_idx",
  kindCheck: "coin_surface_kind_check",
  kindUniqueIndex: "coin_surface_coin_id_kind_unique_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

function absoluteWebUrlCheck(column: AnyPgColumn) {
  return sql`${column} is null or ${column} ~* '^https?://\\S+$'`
}

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
    imageUrl: varchar("image_url", { length: 2048 }),
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
    check(
      coinSurfaceSchemaNames.imageUrlWebUrlCheck,
      absoluteWebUrlCheck(coinSurface.imageUrl)
    ),
  ]
)

export type CoinSurface = typeof coinSurface.$inferSelect
