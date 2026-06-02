import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../client";
import { coin } from "../schema/coin";
import { issuer } from "../schema/issuer";

const defaultGetCoinsLimit = 10;
const parentIssuer = alias(issuer, "parent_issuer");

export type GetCoinsOptions = {
  limit?: number;
};

export function buildGetCoinsQuery(database: typeof db, options: GetCoinsOptions = {}) {
  const { limit = defaultGetCoinsLimit } = options;

  return database
    .select({
      id: coin.id,
      title: coin.title,
      createdAt: coin.createdAt,
      updatedAt: coin.updatedAt,
      issuerCode: issuer.code,
      issuerName: issuer.displayName,
      parentIssuerCode: parentIssuer.code,
      parentIssuerName: parentIssuer.displayName,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .orderBy(desc(coin.createdAt), desc(coin.id))
    .limit(limit);
}

export async function getCoins(options: GetCoinsOptions = {}) {
  const coins = await buildGetCoinsQuery(db, options);

  return coins.map(({ issuerCode, issuerName, parentIssuerCode, parentIssuerName, ...coin }) => ({
    ...coin,
    issuer: {
      code: issuerCode,
      name: issuerName,
      parent: parentIssuerCode && parentIssuerName
        ? {
            code: parentIssuerCode,
            name: parentIssuerName,
          }
        : null,
    },
  }));
}
