import { eq } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"

type CoinRecord = {
  title: string
}

export async function getFullCoin(coinId: string): Promise<CoinRecord | null> {
  const [rows] = await db.select().from(coin).where(eq(coin.id, coinId))

  console.log("[getFullCoin]: ", rows)

  return rows
}
