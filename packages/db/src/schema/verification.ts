import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { authSchemaTimestamptzDateColumn } from "./auth-schema"

export const verificationSchemaNames = {
  identifierValueUniqueIndex: "verification_identifier_value_unique_idx",
} as const

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", authSchemaTimestamptzDateColumn).notNull(),
    createdAt: timestamp("created_at", authSchemaTimestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", authSchemaTimestamptzDateColumn)
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
