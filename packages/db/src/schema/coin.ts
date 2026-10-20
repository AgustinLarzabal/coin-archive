import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { denominations } from "./denomination.js"
import { issuerInsertSchema, issuers } from "./issuer.js"
import type { z } from "zod"

export const coinDistribution = pgEnum("coin_distribution", [
  "standard-circulation",
  "circulating-commemorative",
  "non-circulating",
])

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
    distribution: coinDistribution().notNull(),
    firstIssueYear: integer("first_issue_year").notNull(),
    lastIssueYear: integer("last_issue_year").notNull(),
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
      table.distribution,
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
      "coins_issue_period_ordered",
      sql`${table.firstIssueYear} <= ${table.lastIssueYear}`
    ),
  ]
)

export const coinRecordSchema = createSelectSchema(coins)
export type CoinRecord = z.infer<typeof coinRecordSchema>

function rejectFutureIssueYear(schema: z.ZodNumber) {
  return schema.refine(
    (year) => year <= new Date().getFullYear(),
    "Issue Year cannot be in the future"
  )
}

export const coinSeedRecordSchema = createInsertSchema(coins, {
  firstIssueYear: rejectFutureIssueYear,
  lastIssueYear: rejectFutureIssueYear,
  title: (schema) =>
    schema
      .min(1)
      .refine((title) => title === title.trim(), "Coin title must be trimmed"),
})
  .omit({
    issuerId: true,
    denominationId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({ issuerCode: issuerInsertSchema.shape.code })
  .required()
  .strict()
