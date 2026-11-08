import { sql } from "drizzle-orm"
import { check, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"

import { slugInsertText, trimmedInsertText } from "./validation.js"

export const coinShapes = pgTable(
  "coin_shapes",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
  },
  (table) => [
    unique("coin_shapes_slug_unique").on(table.slug),
    check("coin_shapes_slug_min_length", sql`length(${table.slug}) >= 3`),
    check(
      "coin_shapes_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check("coin_shapes_name_not_empty", sql`length(${table.name}) >= 1`),
    check("coin_shapes_name_trimmed", sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`),
  ]
)
export type CoinShapeRecord = typeof coinShapes.$inferSelect

export const coinShapeInsertSchema = createInsertSchema(coinShapes, {
  slug: slugInsertText,
  name: trimmedInsertText("Coin Shape name"),
})
  .omit({ id: true })
  .required()
  .strict()
