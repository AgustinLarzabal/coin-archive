import { sql } from "drizzle-orm"
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

export const surfaceImageCleanupFailureSchemaNames = {
  createdAtIndex: "surface_image_cleanup_failure_created_at_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const surfaceImageCleanupFailure = pgTable(
  "surface_image_cleanup_failure",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    deletedCoinId: uuid("deleted_coin_id").notNull(),
    imageUrl: varchar("image_url", { length: 2048 }).notNull(),
    errorMessage: varchar("error_message", { length: 2000 }).notNull(),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (surfaceImageCleanupFailure) => [
    index(surfaceImageCleanupFailureSchemaNames.createdAtIndex).on(
      surfaceImageCleanupFailure.createdAt
    ),
  ]
)

export type SurfaceImageCleanupFailure =
  typeof surfaceImageCleanupFailure.$inferSelect
