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

export const rimSchemaNames = {
  codeLowerUniqueIndex: "rim_code_lower_unique_idx",
  codeLookupIndex: "rim_code_lookup_idx",
  codeSlugCheck: "rim_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const rim = pgTable(
  "rim",
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
  (rim) => [
    uniqueIndex(rimSchemaNames.codeLowerUniqueIndex).on(sql`lower(${rim.code})`),
    index(rimSchemaNames.codeLookupIndex).on(sql`lower(${rim.code})`),
    check(
      rimSchemaNames.codeSlugCheck,
      sql`${rim.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Rim = typeof rim.$inferSelect
