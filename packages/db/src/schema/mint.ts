import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { issuers } from "./issuer.js"
import { slugInsertText, trimmedInsertText } from "./validation.js"
import type { z } from "zod"

export const mints = pgTable(
  "mints",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    place: varchar({ length: 200 }).notNull(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => issuers.id, { onDelete: "restrict" }),
    startYear: integer("start_year"),
    endYear: integer("end_year"),
    operating: boolean(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("mints_slug_unique").on(table.slug),
    check(
      "mints_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(${table.slug}) >= 3`
    ),
    check(
      "mints_name_trimmed",
      sql`length(${table.name}) > 0 and ${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "mints_place_trimmed",
      sql`length(${table.place}) > 0 and ${table.place} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "mints_first_year_nonzero",
      sql`${table.startYear} is null or ${table.startYear} <> 0`
    ),
    check(
      "mints_last_year_nonzero",
      sql`${table.endYear} is null or ${table.endYear} <> 0`
    ),
    check(
      "mints_period_ordered",
      sql`${table.startYear} is null or ${table.endYear} is null or ${table.startYear} <= ${table.endYear}`
    ),
    check(
      "mints_operating_matches_end",
      sql`(${table.operating} is distinct from true or ${table.endYear} is null) and (${table.endYear} is null or ${table.operating} is false)`
    ),
  ]
)

export const mintSelectSchema = createSelectSchema(mints)
export const mintInsertSchema = createInsertSchema(mints, {
  slug: slugInsertText,
  name: trimmedInsertText("Mint name"),
  place: trimmedInsertText("Mint place"),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .strict()

export type MintRecord = z.infer<typeof mintSelectSchema>
