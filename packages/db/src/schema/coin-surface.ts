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
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { coins } from "./coin.js"

export const coinSurfaceDescriptionInsertSchema = z
  .string()
  .min(1)
  .max(10_000)
  .refine((description) => description === description.trim(), {
    message: "Coin Surface description must be trimmed",
  })

export const coinSurfaceImageKeyInsertSchema = z
  .string()
  .min(1)
  .refine((imageKey) => new TextEncoder().encode(imageKey).length <= 1_024, {
    message: "Coin Surface image key must be at most 1,024 bytes",
  })
  .refine((imageKey) => imageKey === imageKey.trim(), {
    message: "Coin Surface image key must be trimmed",
  })
  .refine(
    (imageKey) =>
      !imageKey.startsWith("/") &&
      !/^[a-z][a-z0-9+.-]*:/i.test(imageKey) &&
      !imageKey
        .split("/")
        .some((segment) => segment === "." || segment === ".."),
    { message: "Coin Surface image location must be an R2 object key" }
  )

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
  ]
)

export const coinSurfaceRecordSchema = createSelectSchema(coinSurfaces)
export const coinSurfaceInsertSchema = createInsertSchema(coinSurfaces, {
  description: () => coinSurfaceDescriptionInsertSchema,
  imageKey: () => coinSurfaceImageKeyInsertSchema,
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .strict()

export type CoinSurfaceRecord = z.infer<typeof coinSurfaceRecordSchema>
