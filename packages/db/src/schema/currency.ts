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

export const currencySchemaNames = {
  codeLowerUniqueIndex: "currency_code_lower_unique_idx",
  codeLookupIndex: "currency_code_lookup_idx",
  codeSlugCheck: "currency_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const currency = pgTable(
  "currency",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar("code", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (currency) => [
    // Enforces case-insensitive uniqueness for stable currency codes.
    uniqueIndex(currencySchemaNames.codeLowerUniqueIndex).on(
      sql`lower(${currency.code})`
    ),
    // Supports case-insensitive lookups by currency code in shared queries.
    index(currencySchemaNames.codeLookupIndex).on(sql`lower(${currency.code})`),
    check(
      currencySchemaNames.codeSlugCheck,
      sql`${currency.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Currency = typeof currency.$inferSelect
