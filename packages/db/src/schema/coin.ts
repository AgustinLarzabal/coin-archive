import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { denominations } from "./denomination.js"
import { distributionInsertSchema, distributions } from "./distribution.js"
import { issuerInsertSchema, issuers } from "./issuer.js"
import { trimmedInsertText } from "./validation.js"
import type { z } from "zod"

export const coins = pgTable(
  "coins",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 200 }).notNull(),
    issuerId: uuid("issuer_id")
      .notNull()
      .references(() => issuers.id, { onDelete: "restrict" }),
    denominationId: uuid("denomination_id").references(() => denominations.id, {
      onDelete: "restrict",
    }),
    distributionId: uuid("distribution_id")
      .notNull()
      .references(() => distributions.id, { onDelete: "restrict" }),
    firstIssueYear: integer("first_issue_year").notNull(),
    lastIssueYear: integer("last_issue_year").notNull(),
    size: numeric({ mode: "number" }),
    thickness: numeric({ mode: "number" }),
    weight: numeric({ mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("coins_created_at_id_index").on(
      table.createdAt.desc().nullsFirst(),
      table.id.asc()
    ),
    index("coins_issuer_id_created_at_id_index").on(
      table.issuerId,
      table.createdAt.desc().nullsFirst(),
      table.id.asc()
    ),
    index("coins_distribution_created_at_id_index").on(
      table.distributionId,
      table.createdAt.desc().nullsFirst(),
      table.id.asc()
    ),
    check("coins_title_not_empty", sql`length(${table.title}) >= 1`),
    check(
      "coins_title_trimmed",
      sql`${table.title} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check("coins_first_issue_year_not_zero", sql`${table.firstIssueYear} <> 0`),
    check("coins_last_issue_year_not_zero", sql`${table.lastIssueYear} <> 0`),
    check(
      "coins_size_valid",
      sql`${table.size} > 0 and ${table.size} < 'Infinity'::numeric and scale(${table.size}) <= 2`
    ),
    check(
      "coins_thickness_valid",
      sql`${table.thickness} > 0 and ${table.thickness} < 'Infinity'::numeric and scale(${table.thickness}) <= 2`
    ),
    check(
      "coins_weight_valid",
      sql`${table.weight} > 0 and ${table.weight} < 'Infinity'::numeric and scale(${table.weight}) <= 3`
    ),
    check(
      "coins_issue_period_ordered",
      sql`${table.firstIssueYear} <= ${table.lastIssueYear}`
    ),
  ]
)

function rejectFutureIssueYear(schema: z.ZodNumber) {
  return schema.refine(
    (year) => year <= new Date().getFullYear(),
    "Issue Year cannot be in the future"
  )
}

function measurement(maximumFractionDigits: number) {
  return (schema: z.ZodNumber) =>
    schema
      .positive()
      .refine((value) =>
        new RegExp(`^\\d+(?:\\.\\d{1,${maximumFractionDigits}})?$`).test(
          String(value)
        )
      )
}

const coinInsertBaseSchema = createInsertSchema(coins, {
  firstIssueYear: rejectFutureIssueYear,
  lastIssueYear: rejectFutureIssueYear,
  title: trimmedInsertText("Coin title"),
  size: measurement(2),
  thickness: measurement(2),
  weight: measurement(3),
})

export const coinSelectSchema = createSelectSchema(coins)
export const coinInsertSchema = coinInsertBaseSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .strict()

export const coinSeedSchema = coinInsertBaseSchema
  .omit({
    issuerId: true,
    distributionId: true,
    denominationId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    issuerCode: issuerInsertSchema.shape.code,
    distribution: distributionInsertSchema.shape.slug,
  })
  .required({
    id: true,
    title: true,
    firstIssueYear: true,
    lastIssueYear: true,
    issuerCode: true,
    distribution: true,
  })
  .strict()

export type CoinRecord = z.infer<typeof coinSelectSchema>
