import { coin } from "./schema/coin";

export { db } from "./client";
export { coin } from "./schema/coin";

export type Coin = typeof coin.$inferSelect;
