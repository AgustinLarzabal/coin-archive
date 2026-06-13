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

export const engraverSchemaNames = {
  codeLowerUniqueIndex: "engraver_code_lower_unique_idx",
  codeLookupIndex: "engraver_code_lookup_idx",
  codeSlugCheck: "engraver_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const engraver = pgTable(
  "engraver",
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
  (engraver) => [
    // Enforces case-insensitive uniqueness for stable engraver codes.
    uniqueIndex(engraverSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${engraver.code})`
    ),
    // Supports case-insensitive lookups by engraver code in shared queries.
    index(engraverSchemaNames.codeLookupIndex).on(sql`lower(${engraver.code})`),
    check(
      engraverSchemaNames.codeSlugCheck,
      sql`${engraver.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Engraver = typeof engraver.$inferSelect
