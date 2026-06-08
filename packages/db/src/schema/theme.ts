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

export const themeSchemaNames = {
  codeLowerUniqueIndex: "theme_code_lower_unique_idx",
  codeLookupIndex: "theme_code_lookup_idx",
  codeSlugCheck: "theme_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const theme = pgTable(
  "theme",
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
  (theme) => [
    uniqueIndex(themeSchemaNames.codeLowerUniqueIndex).on(sql`lower(${theme.code})`),
    index(themeSchemaNames.codeLookupIndex).on(sql`lower(${theme.code})`),
    check(
      themeSchemaNames.codeSlugCheck,
      sql`${theme.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Theme = typeof theme.$inferSelect
