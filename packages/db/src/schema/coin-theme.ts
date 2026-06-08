import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"
import { coin } from "./coin"
import { theme } from "./theme"

export const coinThemeSchemaNames = {
  coinIdThemeIdPrimaryKey: "coin_theme_coin_id_theme_id_pk",
  coinIdIndex: "coin_theme_coin_id_idx",
  themeIdIndex: "coin_theme_theme_id_idx",
} as const

export const coinTheme = pgTable(
  "coin_theme",
  {
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coin.id, {
        onDelete: "cascade",
      }),
    themeId: uuid("theme_id")
      .notNull()
      .references(() => theme.id, {
        onDelete: "restrict",
      }),
  },
  (coinTheme) => [
    primaryKey({
      name: coinThemeSchemaNames.coinIdThemeIdPrimaryKey,
      columns: [coinTheme.coinId, coinTheme.themeId],
    }),
    index(coinThemeSchemaNames.coinIdIndex).on(coinTheme.coinId),
    index(coinThemeSchemaNames.themeIdIndex).on(coinTheme.themeId),
  ]
)

export type CoinTheme = typeof coinTheme.$inferSelect
