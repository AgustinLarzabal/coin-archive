import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"
import { coin } from "./coin"
import { mint } from "./mint"

export const coinMintSchemaNames = {
  coinIdMintIdPrimaryKey: "coin_mint_coin_id_mint_id_pk",
  coinIdIndex: "coin_mint_coin_id_idx",
  mintIdIndex: "coin_mint_mint_id_idx",
} as const

export const coinMint = pgTable(
  "coin_mint",
  {
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coin.id, {
        onDelete: "cascade",
      }),
    mintId: uuid("mint_id")
      .notNull()
      .references(() => mint.id, {
        onDelete: "restrict",
      }),
  },
  (coinMint) => [
    primaryKey({
      name: coinMintSchemaNames.coinIdMintIdPrimaryKey,
      columns: [coinMint.coinId, coinMint.mintId],
    }),
    index(coinMintSchemaNames.coinIdIndex).on(coinMint.coinId),
    index(coinMintSchemaNames.mintIdIndex).on(coinMint.mintId),
  ]
)

export type CoinMint = typeof coinMint.$inferSelect
