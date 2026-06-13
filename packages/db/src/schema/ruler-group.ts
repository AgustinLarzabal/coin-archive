import { sql } from "drizzle-orm"
import {
  check,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  pgTable,
} from "drizzle-orm/pg-core"

export const rulerGroupSchemaNames = {
  codeSlugCheck: "ruler_group_code_slug_check",
  codeUniqueIndex: "ruler_group_code_unique_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const rulerGroup = pgTable(
  "ruler_group",
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
  (rulerGroup) => [
    // Ruler group codes are lowercase slug-style, so a plain unique index is enough.
    uniqueIndex(rulerGroupSchemaNames.codeUniqueIndex).on(rulerGroup.code),
    check(
      rulerGroupSchemaNames.codeSlugCheck,
      sql`${rulerGroup.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type RulerGroup = typeof rulerGroup.$inferSelect
