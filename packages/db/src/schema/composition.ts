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

export const compositions = pgTable(
  "compositions",
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
    unique("compositions_slug_unique").on(table.slug),
    uniqueIndex("compositions_name_case_insensitive_unique").on(
      sql`lower(${table.name})`
    ),
    check("compositions_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "compositions_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("compositions_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "compositions_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const compositionSelectSchema = createSelectSchema(compositions)
export const compositionInsertSchema = createInsertSchema(compositions, {
  slug: slugInsertText,
  name: trimmedInsertText("Coin Composition name"),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required()
  .strict()

export type CompositionRecord = z.infer<typeof compositionSelectSchema>
