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
import { slugInsertText, trimmedInsertText } from "./validation.js"
import type { z } from "zod"

export const engravers = pgTable(
  "engravers",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("engravers_slug_unique").on(table.slug),
    check("engravers_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "engravers_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("engravers_full_name_not_empty", sql`length(${table.fullName}) >= 1`),
    check(
      "engravers_full_name_trimmed",
      sql`${table.fullName} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const engraverSelectSchema = createSelectSchema(engravers)
export const engraverInsertSchema = createInsertSchema(engravers, {
  slug: slugInsertText,
  fullName: trimmedInsertText("Engraver full name"),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required()
  .strict()

export type EngraverRecord = z.infer<typeof engraverSelectSchema>
