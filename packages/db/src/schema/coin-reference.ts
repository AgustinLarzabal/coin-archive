import { sql } from "drizzle-orm"
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { catalogue } from "./catalogue"
import { coin } from "./coin"

export const coinReferenceSchemaNames = {
  coinIdIndex: "coin_reference_coin_id_idx",
  catalogueIdIndex: "coin_reference_catalogue_id_idx",
  coinIdCatalogueIdNormalizedNumberUniqueIndex:
    "coin_reference_coin_catalogue_number_unique_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const coinReference = pgTable(
  "coin_reference",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coin.id, {
        onDelete: "cascade",
      }),
    catalogueId: uuid("catalogue_id")
      .notNull()
      .references(() => catalogue.id, {
        onDelete: "restrict",
      }),
    number: text("number").notNull(),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (coinReference) => [
    index(coinReferenceSchemaNames.coinIdIndex).on(coinReference.coinId),
    index(coinReferenceSchemaNames.catalogueIdIndex).on(coinReference.catalogueId),
    uniqueIndex(
      coinReferenceSchemaNames.coinIdCatalogueIdNormalizedNumberUniqueIndex
    ).on(
      coinReference.coinId,
      coinReference.catalogueId,
      sql`lower(regexp_replace(btrim(${coinReference.number}), '\\s+', ' ', 'g'))`
    ),
  ]
)

export type CoinReference = typeof coinReference.$inferSelect
