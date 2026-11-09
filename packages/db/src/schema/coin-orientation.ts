import { sql } from "drizzle-orm"
import { check, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"

import { slugInsertText, trimmedInsertText } from "./validation.js"

export const coinOrientations = pgTable(
  "coin_orientations",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
  },
  (table) => [
    unique("coin_orientations_slug_unique").on(table.slug),
    check("coin_orientations_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "coin_orientations_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("coin_orientations_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "coin_orientations_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export type CoinOrientationRecord = typeof coinOrientations.$inferSelect

export const coinOrientationInsertSchema = createInsertSchema(
  coinOrientations,
  {
    slug: slugInsertText,
    name: trimmedInsertText("Coin Orientation name"),
  }
)
  .omit({ id: true })
  .required()
  .strict()
