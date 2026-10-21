import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { slugInsertText, trimmedInsertText } from "./validation.js"
import type { z } from "zod"

export const distributions = pgTable(
  "distributions",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("distributions_slug_unique").on(table.slug),
    uniqueIndex("distributions_name_case_insensitive_unique").on(
      sql`lower(${table.name})`
    ),
    check("distributions_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "distributions_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("distributions_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "distributions_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const distributionSelectSchema = createSelectSchema(distributions)
export const distributionInsertSchema = createInsertSchema(distributions, {
  slug: slugInsertText,
  name: trimmedInsertText("Coin Distribution name"),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required()
  .strict()

export type DistributionRecord = z.infer<typeof distributionSelectSchema>
