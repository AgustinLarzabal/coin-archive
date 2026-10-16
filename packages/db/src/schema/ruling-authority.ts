import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"

import type { z } from "zod"

export const rulingAuthorities = pgTable(
  "ruling_authorities",
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
    unique("ruling_authorities_slug_unique").on(table.slug),
    check(
      "ruling_authorities_slug_min_length",
      sql`length(${table.slug}) >= 3`
    ),
    check(
      "ruling_authorities_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("ruling_authorities_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "ruling_authorities_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const rulingAuthorityRecordSchema = createSelectSchema(rulingAuthorities)
export type RulingAuthorityRecord = z.infer<typeof rulingAuthorityRecordSchema>
