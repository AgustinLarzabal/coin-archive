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
  titleCodeSortIndex: "catalogue_title_code_sort_idx",
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
    // Enforces case-insensitive uniqueness for stable catalogue codes.
    uniqueIndex(catalogueSchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${catalogue.code})`
    ),
    // Supports case-insensitive lookups by catalogue code in shared queries.
    index(catalogueSchemaNames.codeLookupIndex).on(
      sql`lower(${catalogue.code})`
    ),
    // Supports getCatalogues ordering by title, then code.
    index(catalogueSchemaNames.titleCodeSortIndex).on(
      catalogue.title,
      catalogue.code
    ),
  ]
)

export type Catalogue = typeof catalogue.$inferSelect
