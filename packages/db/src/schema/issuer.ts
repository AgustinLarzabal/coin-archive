import { sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

const issuerCodeUniqueIndexName = "issuer_code_unique_idx"
const issuerParentIssuerIdIndexName = "issuer_parent_issuer_id_idx"
const issuerParentIssuerIdSelfCheckName = "issuer_parent_issuer_id_self_check"
const issuerCodeSlugCheckName = "issuer_code_slug_check"

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const issuer = pgTable(
  "issuer",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    parentIssuerId: uuid("parent_issuer_id").references(
      (): AnyPgColumn => issuer.id,
      {
        onDelete: "restrict",
      }
    ),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (issuer) => [
    uniqueIndex(issuerCodeUniqueIndexName).on(issuer.code),
    index(issuerParentIssuerIdIndexName).on(issuer.parentIssuerId),
    check(
      issuerParentIssuerIdSelfCheckName,
      sql`${issuer.parentIssuerId} is null or ${issuer.parentIssuerId} <> ${issuer.id}`
    ),
    check(
      issuerCodeSlugCheckName,
      sql`${issuer.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`
    ),
  ]
)

export type Issuer = typeof issuer.$inferSelect
