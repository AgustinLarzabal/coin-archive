import { sql } from "drizzle-orm"
import { check, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"

import type { z } from "zod"

export const engravers = pgTable(
  "engravers",
  {
    id: uuid().primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("engravers_full_name_not_empty", sql`length(${table.fullName}) >= 1`),
    check(
      "engravers_full_name_trimmed",
      sql`${table.fullName} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const engraverRecordSchema = createSelectSchema(engravers)
export type EngraverRecord = z.infer<typeof engraverRecordSchema>
