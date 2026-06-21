import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import {
  authSchemaTimestamptzDateColumn,
  defaultCollectorRole,
} from "./auth-schema"

export const userSchemaNames = {
  emailLowerUniqueIndex: "user_email_lower_unique_idx",
  roleIndex: "user_role_idx",
  roleCheck: "user_role_check",
} as const

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    role: text("role").notNull().default(defaultCollectorRole),
    createdAt: timestamp("created_at", authSchemaTimestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", authSchemaTimestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (user) => [
    uniqueIndex(userSchemaNames.emailLowerUniqueIndex).on(sql`lower(${user.email})`),
    index(userSchemaNames.roleIndex).on(user.role),
    check(
      userSchemaNames.roleCheck,
      sql`${user.role} in ('collector', 'editor', 'admin')`
    ),
  ]
)

export type User = typeof user.$inferSelect
