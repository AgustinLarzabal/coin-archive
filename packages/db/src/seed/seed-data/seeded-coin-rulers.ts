import { seededCoins } from "./seeded-coins"
import type { SeededCoinRuler } from "./types"

export const seededCoinRulers: SeededCoinRuler[] = seededCoins.map(
  ({ title: coinTitle }) => ({
    coinTitle,
    rulerCode: "felipe-vi",
    rulerOrder: 1,
  })
)
