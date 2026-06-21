import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { user } from "./user"

export const sessionSchemaNames = {
  tokenUniqueIndex: "session_token_unique_idx",
  userIdIndex: "session_user_id_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", timestamptzDateColumn).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (session) => [
    uniqueIndex(sessionSchemaNames.tokenUniqueIndex).on(session.token),
    index(sessionSchemaNames.userIdIndex).on(session.userId),
  ]
)

export type Session = typeof session.$inferSelect
