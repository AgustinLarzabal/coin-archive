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

export const compositionSchemaNames = {
  codeLowerUniqueIndex: "composition_code_lower_unique_idx",
  codeLookupIndex: "composition_code_lookup_idx",
  codeSlugCheck: "composition_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const composition = pgTable(
  "composition",
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
  (composition) => [
    // Enforces case-insensitive uniqueness for stable composition codes.
    uniqueIndex(compositionSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${composition.code})`
    ),
    // Supports case-insensitive lookups by composition code in shared queries.
    index(compositionSchemaNames.codeLookupIndex).on(
      sql`lower(${composition.code})`
    ),
    check(
      compositionSchemaNames.codeSlugCheck,
      sql`${composition.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Composition = typeof composition.$inferSelect
