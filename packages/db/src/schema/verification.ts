import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const verificationSchemaNames = {
  identifierValueUniqueIndex: "verification_identifier_value_unique_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", timestamptzDateColumn).notNull(),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (verification) => [
    uniqueIndex(verificationSchemaNames.identifierValueUniqueIndex).on(
      verification.identifier,
      verification.value
    ),
  ]
)

export type Verification = typeof verification.$inferSelect
