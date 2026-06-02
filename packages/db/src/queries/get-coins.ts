import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../client";
import { coin } from "../schema/coin";
import { issuer } from "../schema/issuer";

const defaultGetCoinsLimit = 10;
const parentIssuer = alias(issuer, "parent_issuer");
const getCoinsSelection = {
  id: coin.id,
  title: coin.title,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
  issuerCode: issuer.code,
  issuerName: issuer.displayName,
  parentIssuerCode: parentIssuer.code,
  parentIssuerName: parentIssuer.displayName,
};

export type GetCoinsOptions = {
  limit?: number;
};

export function buildGetCoinsQuery(database: typeof db, options: GetCoinsOptions = {}) {
  const { limit = defaultGetCoinsLimit } = options;

  return database
    .select(getCoinsSelection)
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .orderBy(desc(coin.createdAt), desc(coin.id))
    .limit(limit);
}

type GetCoinsRow = Awaited<ReturnType<typeof buildGetCoinsQuery>>[number];

function getParentIssuer({
  parentIssuerCode,
  parentIssuerName,
}: Pick<GetCoinsRow, "parentIssuerCode" | "parentIssuerName">) {
  if (!parentIssuerCode || !parentIssuerName) {
    return null;
  }

  return {
    code: parentIssuerCode,
    name: parentIssuerName,
  };
}

function toCoinWithIssuer({
  issuerCode,
  issuerName,
  parentIssuerCode,
  parentIssuerName,
  ...coinRecord
}: GetCoinsRow) {
  return {
    ...coinRecord,
    issuer: {
      code: issuerCode,
      name: issuerName,
      parent: getParentIssuer({ parentIssuerCode, parentIssuerName }),
    },
  };
}

export async function getCoins(options: GetCoinsOptions = {}) {
  const coins = await buildGetCoinsQuery(db, options);

  return coins.map(toCoinWithIssuer);
}
