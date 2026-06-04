import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { coin } from "./coin"
import { ruler } from "./ruler"

export const coinRulerSchemaNames = {
  coinIdRulerIdPrimaryKey: "coin_ruler_coin_id_ruler_id_pk",
  coinIdRulerOrderUniqueIndex: "coin_ruler_coin_id_ruler_order_unique_idx",
  coinIdRulerOrderIndex: "coin_ruler_coin_id_ruler_order_idx",
  rulerIdIndex: "coin_ruler_ruler_id_idx",
  rulerOrderPositiveCheck: "coin_ruler_ruler_order_positive_check",
} as const

export const coinRuler = pgTable(
  "coin_ruler",
  {
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coin.id, {
        onDelete: "cascade",
      }),
    rulerId: uuid("ruler_id")
      .notNull()
      .references(() => ruler.id, {
        onDelete: "restrict",
      }),
    rulerOrder: integer("ruler_order").notNull(),
  },
  (coinRuler) => [
    primaryKey({
      name: coinRulerSchemaNames.coinIdRulerIdPrimaryKey,
      columns: [coinRuler.coinId, coinRuler.rulerId],
    }),
    uniqueIndex(coinRulerSchemaNames.coinIdRulerOrderUniqueIndex).on(
      coinRuler.coinId,
      coinRuler.rulerOrder
    ),
    index(coinRulerSchemaNames.coinIdRulerOrderIndex).on(
      coinRuler.coinId,
      coinRuler.rulerOrder
    ),
    index(coinRulerSchemaNames.rulerIdIndex).on(coinRuler.rulerId),
    check(
      coinRulerSchemaNames.rulerOrderPositiveCheck,
      sql`${coinRuler.rulerOrder} > 0`
    ),
  ]
)

export type CoinRuler = typeof coinRuler.$inferSelect
