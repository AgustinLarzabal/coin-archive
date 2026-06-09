import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"
import { coinFace } from "./coin-face"
import { engraver } from "./engraver"

export const coinFaceEngraverSchemaNames = {
  coinFaceIdIndex: "coin_face_engraver_coin_face_id_idx",
  engraverIdIndex: "coin_face_engraver_engraver_id_idx",
} as const

export const coinFaceEngraver = pgTable(
  "coin_face_engraver",
  {
    coinFaceId: uuid("coin_face_id")
      .notNull()
      .references(() => coinFace.id, {
        onDelete: "cascade",
      }),
    engraverId: uuid("engraver_id")
      .notNull()
      .references(() => engraver.id, {
        onDelete: "restrict",
      }),
  },
  (coinFaceEngraver) => [
    primaryKey({
      columns: [coinFaceEngraver.coinFaceId, coinFaceEngraver.engraverId],
    }),
    index(coinFaceEngraverSchemaNames.coinFaceIdIndex).on(
      coinFaceEngraver.coinFaceId
    ),
    index(coinFaceEngraverSchemaNames.engraverIdIndex).on(
      coinFaceEngraver.engraverId
    ),
  ]
)

export type CoinFaceEngraver = typeof coinFaceEngraver.$inferSelect
