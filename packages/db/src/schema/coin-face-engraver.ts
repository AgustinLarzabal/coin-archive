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
import {
  coinSurface,
  coinSurfaceKinds,
  type CoinSurfaceKind,
} from "./coin-surface"
import { engraver } from "./engraver"

export const coinFaceEngraverSchemaNames = {
  coinFaceIdIndex: "coin_face_engraver_coin_face_id_idx",
  coinFaceIdKindFk: "coin_face_engraver_coin_face_id_kind_fk",
  coinFaceKindCheck: "coin_face_engraver_coin_face_kind_check",
  coinFaceKindIndex: "coin_face_engraver_coin_face_kind_idx",
  engraverIdIndex: "coin_face_engraver_engraver_id_idx",
} as const
const coinFaceKinds = coinSurfaceKinds.filter(
  (kind): kind is Extract<CoinSurfaceKind, "obverse" | "reverse"> =>
    kind !== "edge-surface"
)
const coinFaceKindsSql = sql.raw(
  `(${coinFaceKinds.map((kind) => `'${kind}'`).join(", ")})`
)

export const coinFaceEngraver = pgTable(
  "coin_face_engraver",
  {
    coinFaceId: uuid("coin_face_id")
      .notNull()
      .$type<string>(),
    coinFaceKind: varchar("coin_face_kind", { length: 16 })
      .$type<(typeof coinFaceKinds)[number]>()
      .notNull(),
    engraverId: uuid("engraver_id")
      .notNull()
      .references(() => engraver.id, {
        onDelete: "restrict",
      }),
  },
  (coinFaceEngraver) => [
    primaryKey({
      columns: [
        coinFaceEngraver.coinFaceId,
        coinFaceEngraver.coinFaceKind,
        coinFaceEngraver.engraverId,
      ],
    }),
    foreignKey({
      columns: [coinFaceEngraver.coinFaceId, coinFaceEngraver.coinFaceKind],
      foreignColumns: [coinSurface.id, coinSurface.kind],
      name: coinFaceEngraverSchemaNames.coinFaceIdKindFk,
    }).onDelete("cascade"),
    index(coinFaceEngraverSchemaNames.coinFaceIdIndex).on(
      coinFaceEngraver.coinFaceId
    ),
    index(coinFaceEngraverSchemaNames.coinFaceKindIndex).on(
      coinFaceEngraver.coinFaceKind
    ),
    index(coinFaceEngraverSchemaNames.engraverIdIndex).on(
      coinFaceEngraver.engraverId
    ),
    check(
      coinFaceEngraverSchemaNames.coinFaceKindCheck,
      sql`${coinFaceEngraver.coinFaceKind} in ${coinFaceKindsSql}`
    ),
  ]
)

export type CoinFaceEngraver = typeof coinFaceEngraver.$inferSelect
