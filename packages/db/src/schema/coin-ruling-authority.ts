import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { coins } from "./coin.js"
import { rulingAuthorities } from "./ruling-authority.js"
import type { z } from "zod"

export const coinRulingAuthorityAttributions = pgTable(
  "coin_ruling_authorities",
  {
    id: uuid().primaryKey().defaultRandom(),
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coins.id, { onDelete: "cascade" }),
    rulingAuthorityId: uuid("ruling_authority_id")
      .notNull()
      .references(() => rulingAuthorities.id, { onDelete: "restrict" }),
    position: integer().notNull(),
  },
  (table) => [
    unique("coin_ruling_authorities_coin_position_unique").on(
      table.coinId,
      table.position
    ),
    unique("coin_ruling_authorities_context_unique").on(
      table.coinId,
      table.rulingAuthorityId
    ),
    index("coin_ruling_authorities_authority_coin_index").on(
      table.rulingAuthorityId,
      table.coinId
    ),
    check(
      "coin_ruling_authorities_position_positive",
      sql`${table.position} > 0`
    ),
  ]
)

export const coinRulingAuthorityAttributionSelectSchema = createSelectSchema(
  coinRulingAuthorityAttributions
)
export const coinRulingAuthorityAttributionInsertSchema = createInsertSchema(
  coinRulingAuthorityAttributions,
  {
    position: (schema) => schema.positive(),
  }
)
  .omit({ id: true })
  .strict()

export type CoinRulingAuthorityAttributionRecord = z.infer<
  typeof coinRulingAuthorityAttributionSelectSchema
>
