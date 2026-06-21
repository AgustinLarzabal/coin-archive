import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { user } from "./user"

export const accountSchemaNames = {
  providerAccountUniqueIndex: "account_provider_id_account_id_unique_idx",
  userIdIndex: "account_user_id_idx",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", timestamptzDateColumn),
    refreshTokenExpiresAt: timestamp(
      "refresh_token_expires_at",
      timestamptzDateColumn
    ),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (account) => [
    uniqueIndex(accountSchemaNames.providerAccountUniqueIndex).on(
      account.providerId,
      account.accountId
    ),
    index(accountSchemaNames.userIdIndex).on(account.userId),
  ]
)

export type Account = typeof account.$inferSelect
