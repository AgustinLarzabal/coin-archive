import { sql } from "drizzle-orm"
import {
  check,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"
import { currencies } from "./currency.js"
import type { z } from "zod"

export const denominations = pgTable(
  "denominations",
  {
    id: uuid().primaryKey().defaultRandom(),
    currencyId: uuid("currency_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    label: varchar({ length: 200 }).notNull(),
    amount: numeric().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("denominations_currency_label_unique").on(
      table.currencyId,
      sql`lower(${table.label})`
    ),
    check("denominations_label_not_empty", sql`length(${table.label}) >= 1`),
    check(
      "denominations_label_trimmed",
      sql`${table.label} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check("denominations_amount_positive", sql`${table.amount} > 0`),
    check(
      "denominations_amount_integer_digits",
      sql`${table.amount} < 1000000000000000000`
    ),
    check(
      "denominations_amount_fractional_digits",
      sql`scale(${table.amount}) <= 12`
    ),
  ]
)

export const denominationRecordSchema = createSelectSchema(denominations)
export type DenominationRecord = z.infer<typeof denominationRecordSchema>
