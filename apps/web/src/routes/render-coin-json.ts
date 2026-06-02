import type { Coin } from "@workspace/db"

export function renderCoinJson(coins: Coin[]) {
  return JSON.stringify(coins, null, 2)
}
