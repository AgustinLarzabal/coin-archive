import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  pgTable,
} from "drizzle-orm/pg-core"
import { rulerGroup } from "./ruler-group"

export const rulerSchemaNames = {
  codeSlugCheck: "ruler_code_slug_check",
  codeUniqueIndex: "ruler_code_unique_idx",
  rulerGroupIdIndex: "ruler_ruler_group_id_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const ruler = pgTable(
  "ruler",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar("code", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    rulerGroupId: uuid("ruler_group_id").references(() => rulerGroup.id, {
      onDelete: "restrict",
    }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (ruler) => [
    // Ruler codes are lowercase slug-style, so a plain unique index is enough.
    uniqueIndex(rulerSchemaNames.codeUniqueIndex).on(ruler.code),
    // Supports joins and filters by the optional flat ruler-group label.
    index(rulerSchemaNames.rulerGroupIdIndex).on(ruler.rulerGroupId),
    check(
      rulerSchemaNames.codeSlugCheck,
      sql`${ruler.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Ruler = typeof ruler.$inferSelect
