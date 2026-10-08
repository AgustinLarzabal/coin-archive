import { sql } from "drizzle-orm"
import {
  check,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

import { coinSurfaces } from "./coin-surface.js"
import { engravers } from "./engraver.js"

export const coinSurfaceEngravers = pgTable(
  "coin_surface_engravers",
  {
    coinSurfaceId: uuid("coin_surface_id")
      .notNull()
      .references(() => coinSurfaces.id, { onDelete: "cascade" }),
    engraverId: uuid("engraver_id")
      .notNull()
      .references(() => engravers.id, { onDelete: "restrict" }),
    position: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.coinSurfaceId, table.engraverId] }),
    unique("coin_surface_engravers_surface_position_unique").on(
      table.coinSurfaceId,
      table.position
    ),
    check(
      "coin_surface_engravers_position_positive",
      sql`${table.position} > 0`
    ),
  ]
)
