import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { coinSurface, engraverSurfaceKinds } from "./coin-surface"
import type { EngravableCoinSurfaceKind } from "./coin-surface"
import { engraver } from "./engraver"

export const coinSurfaceEngraverSchemaNames = {
  faceOnlyCheck: "coin_face_engraver_face_only_check",
  coinSurfaceIdIndex: "coin_face_engraver_coin_face_id_idx",
  coinSurfaceIdKindFk: "coin_face_engraver_coin_face_id_kind_fk",
  coinSurfaceKindCheck: "coin_face_engraver_coin_face_kind_check",
  coinSurfaceKindIndex: "coin_face_engraver_coin_face_kind_idx",
  engraverIdIndex: "coin_face_engraver_engraver_id_idx",
} as const
const engraverSurfaceKindsSql = sql.raw(
  `(${engraverSurfaceKinds.map((kind) => `'${kind}'`).join(", ")})`
)

export const coinSurfaceEngraver = pgTable(
  "coin_face_engraver",
  {
    coinSurfaceId: uuid("coin_face_id").notNull().$type<string>(),
    coinSurfaceKind: varchar("coin_face_kind", { length: 16 })
      .$type<EngravableCoinSurfaceKind>()
      .notNull(),
    engraverId: uuid("engraver_id")
      .notNull()
      .references(() => engraver.id, {
        onDelete: "restrict",
      }),
  },
  (coinSurfaceEngraver) => [
    primaryKey({
      columns: [
        coinSurfaceEngraver.coinSurfaceId,
        coinSurfaceEngraver.coinSurfaceKind,
        coinSurfaceEngraver.engraverId,
      ],
    }),
    foreignKey({
      columns: [
        coinSurfaceEngraver.coinSurfaceId,
        coinSurfaceEngraver.coinSurfaceKind,
      ],
      foreignColumns: [coinSurface.id, coinSurface.kind],
      name: coinSurfaceEngraverSchemaNames.coinSurfaceIdKindFk,
    }).onDelete("cascade"),
    index(coinSurfaceEngraverSchemaNames.coinSurfaceIdIndex).on(
      coinSurfaceEngraver.coinSurfaceId
    ),
    index(coinSurfaceEngraverSchemaNames.coinSurfaceKindIndex).on(
      coinSurfaceEngraver.coinSurfaceKind
    ),
    index(coinSurfaceEngraverSchemaNames.engraverIdIndex).on(
      coinSurfaceEngraver.engraverId
    ),
    check(
      coinSurfaceEngraverSchemaNames.coinSurfaceKindCheck,
      sql`${coinSurfaceEngraver.coinSurfaceKind} in ${engraverSurfaceKindsSql}`
    ),
  ]
)

export type CoinSurfaceEngraver = typeof coinSurfaceEngraver.$inferSelect
