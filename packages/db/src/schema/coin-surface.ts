import { sql } from "drizzle-orm"
import {
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"

import { coins } from "./coin.js"
import type { z } from "zod"

export const coinSurfaceKind = pgEnum("coin_surface_kind", [
  "obverse",
  "reverse",
  "edge",
])

export const coinSurfaces = pgTable(
  "coin_surfaces",
  {
    id: uuid().primaryKey().defaultRandom(),
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coins.id, { onDelete: "cascade" }),
    kind: coinSurfaceKind().notNull(),
    description: text(),
    imageKey: text("image_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("coin_surfaces_coin_id_kind_unique").on(table.coinId, table.kind),
    check(
      "coin_surfaces_description_length",
      sql`${table.description} is null or length(${table.description}) between 1 and 10000`
    ),
    check(
      "coin_surfaces_description_trimmed",
      sql`${table.description} is null or ${table.description} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "coin_surfaces_image_key_length",
      sql`${table.imageKey} is null or octet_length(${table.imageKey}) between 1 and 1024`
    ),
    check(
      "coin_surfaces_image_key_trimmed",
      sql`${table.imageKey} is null or ${table.imageKey} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "coin_surfaces_image_key_format",
      sql`${table.imageKey} is null or (${table.imageKey} !~ '^/' and ${table.imageKey} !~* '^[a-z][a-z0-9+.-]*:' and ${table.imageKey} !~ '(^|/)[.]{1,2}(/|$)')`
    ),
    check(
      "coin_surfaces_has_catalogue_data",
      sql`${table.description} is not null or ${table.imageKey} is not null`
    ),
  ]
)

export const coinSurfaceRecordSchema = createSelectSchema(coinSurfaces)
export type CoinSurfaceRecord = z.infer<typeof coinSurfaceRecordSchema>
