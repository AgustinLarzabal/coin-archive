import { inArray } from "drizzle-orm";
import { db } from "./client";
import { coin } from "./schema/coin";
import { seededCoins } from "./seed-data";

async function seedCoins() {
  await db.delete(coin).where(inArray(coin.title, seededCoins.map(({ title }) => title)));

  await db.insert(coin).values(seededCoins);
}

void seedCoins();
