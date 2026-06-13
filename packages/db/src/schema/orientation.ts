import { sql } from "drizzle-orm"
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const orientationSchemaNames = {
  codeLowerUniqueIndex: "orientation_code_lower_unique_idx",
  codeLookupIndex: "orientation_code_lookup_idx",
  codeSlugCheck: "orientation_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const orientation = pgTable(
  "orientation",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar("code", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (orientation) => [
    // Enforces case-insensitive uniqueness for stable orientation codes.
    uniqueIndex(orientationSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${orientation.code})`
    ),
    // Supports case-insensitive lookups by orientation code in shared queries.
    index(orientationSchemaNames.codeLookupIndex).on(
      sql`lower(${orientation.code})`
    ),
    check(
      orientationSchemaNames.codeSlugCheck,
      sql`${orientation.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Orientation = typeof orientation.$inferSelect
