import { sql } from "drizzle-orm"
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const catalogueSchemaNames = {
  codeLowerUniqueIndex: "catalogue_code_lower_unique_idx",
  codeLookupIndex: "catalogue_code_lookup_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const catalogue = pgTable(
  "catalogue",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar("code", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (catalogue) => [
    uniqueIndex(catalogueSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${catalogue.code})`
    ),
    index(catalogueSchemaNames.codeLookupIndex).on(sql`lower(${catalogue.code})`),
  ]
)

export type Catalogue = typeof catalogue.$inferSelect
