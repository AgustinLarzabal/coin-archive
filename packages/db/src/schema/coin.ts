import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { distribution } from "./distribution"
import { issuer } from "./issuer"

export const coinSchemaNames = {
  diameterPositiveCheck: "coin_diameter_positive_check",
  distributionIdIndex: "coin_distribution_id_idx",
  issueYearRangeClosedCheck: "coin_issue_year_range_closed_check",
  issueYearRangeIndex: "coin_issue_year_range_idx",
  issueYearRangeOrderCheck: "coin_issue_year_range_order_check",
  issuerIdIndex: "coin_issuer_id_idx",
  recentCreatedAtIdIndex: "coin_recent_created_at_id_idx",
  thicknessPositiveCheck: "coin_thickness_positive_check",
  weightPositiveCheck: "coin_weight_positive_check",
} as const

const timestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const coin = pgTable(
  "coin",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    title: varchar("title", { length: 255 }).notNull(),
    issuerId: uuid("issuer_id")
      .notNull()
      .references(() => issuer.id, {
        onDelete: "restrict",
      }),
    distributionId: uuid("distribution_id")
      .notNull()
      .references(() => distribution.id, {
        onDelete: "restrict",
      }),
    weight: numeric("weight", { precision: 10, scale: 2 }),
    diameter: numeric("diameter", { precision: 10, scale: 2 }),
    thickness: numeric("thickness", { precision: 10, scale: 2 }),
    minYear: integer("min_year"),
    maxYear: integer("max_year"),
    createdAt: timestamp("created_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", timestamptzDateColumn)
      .notNull()
      .defaultNow(),
  },
  (coin) => [
    index(coinSchemaNames.recentCreatedAtIdIndex).on(
      coin.createdAt.desc(),
      coin.id.desc()
    ),
    index(coinSchemaNames.issuerIdIndex).on(coin.issuerId),
    index(coinSchemaNames.distributionIdIndex).on(coin.distributionId),
    index(coinSchemaNames.issueYearRangeIndex).on(coin.minYear, coin.maxYear),
    check(
      coinSchemaNames.issueYearRangeClosedCheck,
      sql`(${coin.minYear} is null and ${coin.maxYear} is null) or (${coin.minYear} is not null and ${coin.maxYear} is not null)`
    ),
    check(
      coinSchemaNames.issueYearRangeOrderCheck,
      sql`${coin.minYear} is null or ${coin.maxYear} is null or ${coin.minYear} <= ${coin.maxYear}`
    ),
    check(
      coinSchemaNames.weightPositiveCheck,
      sql`${coin.weight} is null or ${coin.weight} > 0`
    ),
    check(
      coinSchemaNames.diameterPositiveCheck,
      sql`${coin.diameter} is null or ${coin.diameter} > 0`
    ),
    check(
      coinSchemaNames.thicknessPositiveCheck,
      sql`${coin.thickness} is null or ${coin.thickness} > 0`
    ),
  ]
)

export type Coin = typeof coin.$inferSelect
