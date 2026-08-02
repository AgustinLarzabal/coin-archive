import {
  index,
  jsonb,
  primaryKey,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const maintenanceIdempotency = pgTable(
  "maintenance_idempotency",
  {
    collectorId: text("collector_id").notNull(),
    operation: varchar("operation", { length: 255 }).notNull(),
    key: varchar("key", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    response: jsonb("response"),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", timestamptzDateColumn).notNull(),
  },
  (record) => [
    primaryKey({
      columns: [record.collectorId, record.operation, record.key],
      name: "maintenance_idempotency_pkey",
    }),
    index("maintenance_idempotency_expires_at_idx").on(record.expiresAt),
  ]
)
