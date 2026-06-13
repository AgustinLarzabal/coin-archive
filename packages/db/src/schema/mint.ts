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

export const mintSchemaNames = {
  codeLowerUniqueIndex: "mint_code_lower_unique_idx",
  codeLookupIndex: "mint_code_lookup_idx",
  codeSlugCheck: "mint_code_slug_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const mint = pgTable(
  "mint",
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
  (mint) => [
    // Enforces case-insensitive uniqueness for stable mint codes.
    uniqueIndex(mintSchemaNames.codeLowerUniqueIndex).on(sql`lower(${mint.code})`),
    // Supports case-insensitive lookups by mint code in shared queries.
    index(mintSchemaNames.codeLookupIndex).on(sql`lower(${mint.code})`),
    check(
      mintSchemaNames.codeSlugCheck,
      sql`${mint.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Mint = typeof mint.$inferSelect
