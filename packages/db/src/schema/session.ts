import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { authSchemaTimestamptzDateColumn } from "./auth-schema"
import { user } from "./user"

export const sessionSchemaNames = {
  tokenUniqueIndex: "session_token_unique_idx",
  userIdIndex: "session_user_id_idx",
} as const

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", authSchemaTimestamptzDateColumn).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", authSchemaTimestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", authSchemaTimestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (session) => [
    uniqueIndex(sessionSchemaNames.tokenUniqueIndex).on(session.token),
    index(sessionSchemaNames.userIdIndex).on(session.userId),
  ]
)

export type Session = typeof session.$inferSelect
