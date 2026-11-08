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

export const tags = pgTable(
  "tags",
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
    unique("tags_slug_unique").on(table.slug),
    uniqueIndex("tags_name_case_insensitive_unique").on(
      sql`lower(${table.name})`
    ),
    check(
      "tags_slug_format",
      sql`length(${table.slug}) >= 3 and ${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check(
      "tags_name_trimmed",
      sql`length(${table.name}) >= 1 and ${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const tagSelectSchema = createSelectSchema(tags)
export const tagInsertSchema = createInsertSchema(tags, {
  slug: slugInsertText,
  name: trimmedInsertText("Tag name"),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required()
  .strict()
export type TagRecord = z.infer<typeof tagSelectSchema>
