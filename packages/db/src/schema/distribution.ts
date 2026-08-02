import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const distributionSchemaNames = {
  codeLowerUniqueIndex: "distribution_code_lower_unique_idx",
  codeLookupIndex: "distribution_code_lookup_idx",
  codeSlugCheck: "distribution_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const distribution = pgTable(
  "distribution",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar("code", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (distribution) => [
    // Enforces case-insensitive uniqueness for stable distribution codes.
    uniqueIndex(distributionSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${distribution.code})`
    ),
    // Supports case-insensitive lookups by distribution code in shared queries.
    index(distributionSchemaNames.codeLookupIndex).on(
      sql`lower(${distribution.code})`
    ),
    check(
      distributionSchemaNames.codeSlugCheck,
      sql`${distribution.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Distribution = typeof distribution.$inferSelect
