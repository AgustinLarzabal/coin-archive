import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { coins } from "./coin.js"
import { rulingAuthorities } from "./ruling-authority.js"
import { trimmedInsertText } from "./validation.js"

const tenureMaximumLength = 200
export const coinRulingAuthorityTenureInsertSchema = trimmedInsertText(
  "Ruling Authority Tenure Label"
)(z.string().max(tenureMaximumLength))

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
    role: varchar({ length: 100 }).notNull(),
    tenure: varchar({ length: tenureMaximumLength }),
    position: integer().notNull(),
  },
  (table) => [
    unique("coin_ruling_authorities_coin_position_unique").on(
      table.coinId,
      table.position
    ),
    unique("coin_ruling_authorities_context_unique")
      .on(table.coinId, table.rulingAuthorityId, table.role, table.tenure)
      .nullsNotDistinct(),
    index("coin_ruling_authorities_authority_coin_index").on(
      table.rulingAuthorityId,
      table.coinId
    ),
    check(
      "coin_ruling_authorities_role_not_empty",
      sql`length(${table.role}) >= 1`
    ),
    check(
      "coin_ruling_authorities_role_trimmed",
      sql`${table.role} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "coin_ruling_authorities_tenure_not_empty",
      sql`${table.tenure} is null or length(${table.tenure}) >= 1`
    ),
    check(
      "coin_ruling_authorities_tenure_trimmed",
      sql`${table.tenure} is null or ${table.tenure} !~ '^[[:space:]]|[[:space:]]$'`
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
    role: trimmedInsertText("Ruling Authority Role"),
    tenure: () => coinRulingAuthorityTenureInsertSchema,
    position: (schema) => schema.positive(),
  }
)
  .omit({ id: true })
  .strict()

export type CoinRulingAuthorityAttributionRecord = z.infer<
  typeof coinRulingAuthorityAttributionSelectSchema
>
