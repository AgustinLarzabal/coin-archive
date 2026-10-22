import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"

import { coins } from "./coin.js"
import { mints } from "./mint.js"

export const coinMints = pgTable(
  "coin_mints",
  {
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coins.id, { onDelete: "cascade" }),
    mintId: uuid("mint_id")
      .notNull()
      .references(() => mints.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.coinId, table.mintId] }),
    index("coin_mints_mint_id_index").on(table.mintId),
  ]
)
