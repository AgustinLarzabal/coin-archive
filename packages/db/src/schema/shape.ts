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

export const shapeSchemaNames = {
  codeLowerUniqueIndex: "shape_code_lower_unique_idx",
  codeLookupIndex: "shape_code_lookup_idx",
  codeSlugCheck: "shape_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const shape = pgTable(
  "shape",
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
  (shape) => [
    uniqueIndex(shapeSchemaNames.codeLowerUniqueIndex).on(sql`lower(${shape.code})`),
    index(shapeSchemaNames.codeLookupIndex).on(sql`lower(${shape.code})`),
    check(
      shapeSchemaNames.codeSlugCheck,
      sql`${shape.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Shape = typeof shape.$inferSelect
