import { desc } from "drizzle-orm";
import { db } from "../client";
import { coin } from "../schema/coin";

const defaultGetCoinsLimit = 10;

export type GetCoinsOptions = {
  limit?: number;
};

export async function getCoins(options: GetCoinsOptions = {}) {
  const { limit = defaultGetCoinsLimit } = options;

  return db
    .select()
    .from(coin)
    .orderBy(desc(coin.createdAt), desc(coin.id))
    .limit(limit);
}
