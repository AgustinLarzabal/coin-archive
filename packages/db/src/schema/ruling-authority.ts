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

export const rulingAuthorities = pgTable(
  "ruling_authorities",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    role: varchar({ length: 100 }).notNull(),
    tenure: varchar({ length: 200 }),
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
    check("ruling_authorities_role_not_empty", sql`length(${table.role}) >= 1`),
    check(
      "ruling_authorities_role_trimmed",
      sql`${table.role} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "ruling_authorities_tenure_not_empty",
      sql`${table.tenure} is null or length(${table.tenure}) >= 1`
    ),
    check(
      "ruling_authorities_tenure_trimmed",
      sql`${table.tenure} is null or ${table.tenure} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const rulingAuthoritySelectSchema = createSelectSchema(rulingAuthorities)
export const rulingAuthorityInsertSchema = createInsertSchema(
  rulingAuthorities,
  {
    slug: slugInsertText,
    name: trimmedInsertText("Ruling Authority name"),
    role: trimmedInsertText("Ruling Authority Role"),
    tenure: trimmedInsertText("Ruling Authority Tenure Label"),
  }
)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required({ slug: true, name: true, role: true })
  .strict()

export type RulingAuthorityRecord = z.infer<typeof rulingAuthoritySelectSchema>
