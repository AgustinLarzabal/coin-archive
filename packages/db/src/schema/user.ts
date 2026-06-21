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

export const collectorRoleValues = ["collector", "editor", "admin"] as const

export const userSchemaNames = {
  emailLowerUniqueIndex: "user_email_lower_unique_idx",
  roleCheck: "user_role_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    role: text("role").notNull().default("collector"),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (user) => [
    uniqueIndex(userSchemaNames.emailLowerUniqueIndex).on(sql`lower(${user.email})`),
    index("user_role_idx").on(user.role),
    check(
      userSchemaNames.roleCheck,
      sql`${user.role} in ('collector', 'editor', 'admin')`
    ),
  ]
)

export type User = typeof user.$inferSelect
