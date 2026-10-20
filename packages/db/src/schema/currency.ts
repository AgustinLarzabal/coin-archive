import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { trimmedInsertText } from "./validation.js"
import type { z } from "zod"

export const currencies = pgTable(
  "currencies",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    periodLabel: varchar("period_label", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("currencies_slug_unique").on(table.slug),
    check("currencies_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "currencies_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("currencies_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "currencies_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "currencies_period_label_not_empty",
      sql`length(${table.periodLabel}) >= 1`
    ),
    check(
      "currencies_period_label_trimmed",
      sql`${table.periodLabel} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const currencySelectSchema = createSelectSchema(currencies)
export const currencyInsertSchema = createInsertSchema(currencies, {
  slug: (schema) =>
    schema
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: trimmedInsertText("Currency Name"),
  periodLabel: trimmedInsertText("Currency Period Label"),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required()
  .strict()

export type CurrencyRecord = z.infer<typeof currencySelectSchema>
