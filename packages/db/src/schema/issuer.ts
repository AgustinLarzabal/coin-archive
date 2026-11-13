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

export const issuers = pgTable(
  "issuers",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 200 }).notNull(),
    code: varchar({ length: 12 }).notNull(),
    slug: varchar({ length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("issuers_code_unique").on(table.code),
    unique("issuers_slug_unique").on(table.slug),
    check(
      "issuers_slug_min_length",
      sql`${table.slug} is null or length(${table.slug}) >= 3`
    ),
    check(
      "issuers_slug_format",
      sql`${table.slug} is null or ${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("issuers_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "issuers_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "issuers_code_format",
      sql`${table.code} ~ '^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$'`
    ),
  ]
)

export const issuerSelectSchema = createSelectSchema(issuers)
export const issuerInsertSchema = createInsertSchema(issuers, {
  name: (schema) => trimmedInsertText("Issuer name")(schema.max(200)),
  code: (schema) =>
    schema.regex(
      /^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/,
      "Issuer Code must be two uppercase ASCII letters or an Archive-defined 3–12 character code"
    ),
  slug: slugInsertText,
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .strict()

export type IssuerRecord = z.infer<typeof issuerSelectSchema>
