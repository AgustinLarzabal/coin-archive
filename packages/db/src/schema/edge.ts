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

export const edgeSchemaNames = {
  codeLowerUniqueIndex: "edge_code_lower_unique_idx",
  codeLookupIndex: "edge_code_lookup_idx",
  codeSlugCheck: "edge_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const edge = pgTable(
  "edge",
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
  (edge) => [
    // Enforces case-insensitive uniqueness for stable edge codes.
    uniqueIndex(edgeSchemaNames.codeLowerUniqueIndex).on(sql`lower(${edge.code})`),
    // Supports case-insensitive lookups by edge code in shared queries.
    index(edgeSchemaNames.codeLookupIndex).on(sql`lower(${edge.code})`),
    check(
      edgeSchemaNames.codeSlugCheck,
      sql`${edge.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Edge = typeof edge.$inferSelect
