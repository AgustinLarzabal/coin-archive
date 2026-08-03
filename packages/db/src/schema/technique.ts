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

export const techniqueSchemaNames = {
  codeLowerUniqueIndex: "technique_code_lower_unique_idx",
  codeLookupIndex: "technique_code_lookup_idx",
  codeSlugCheck: "technique_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const technique = pgTable(
  "technique",
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
  (technique) => [
    // Enforces case-insensitive uniqueness for stable technique codes.
    uniqueIndex(techniqueSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${technique.code})`
    ),
    // Supports case-insensitive lookups by technique code in shared queries.
    index(techniqueSchemaNames.codeLookupIndex).on(
      sql`lower(${technique.code})`
    ),
    check(
      techniqueSchemaNames.codeSlugCheck,
      sql`${technique.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Technique = typeof technique.$inferSelect
