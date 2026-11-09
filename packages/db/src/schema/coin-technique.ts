import { sql } from "drizzle-orm"
import { check, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"

import { slugInsertText, trimmedInsertText } from "./validation.js"

export const coinTechniques = pgTable(
  "coin_techniques",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
  },
  (table) => [
    unique("coin_techniques_slug_unique").on(table.slug),
    check("coin_techniques_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "coin_techniques_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("coin_techniques_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "coin_techniques_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export type CoinTechniqueRecord = typeof coinTechniques.$inferSelect

export const coinTechniqueInsertSchema = createInsertSchema(coinTechniques, {
  slug: slugInsertText,
  name: trimmedInsertText("Coin Technique name"),
})
  .omit({ id: true })
  .required()
  .strict()
