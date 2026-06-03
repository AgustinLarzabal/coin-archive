import { coin } from "../schema/coin";
import { issuer } from "../schema/issuer";
import { db } from "../index";

type CreateIssuerInput = {
  code: string;
  name: string;
  parentIssuerId?: string;
};

type CreateCoinInput = {
  createdAt: Date;
  issuerId: string;
  title: string;
  updatedAt?: Date;
};

export async function createIssuer({
  code,
  name,
  parentIssuerId,
}: CreateIssuerInput) {
  const [createdIssuer] = await db
    .insert(issuer)
    .values({
      code,
      name,
      parentIssuerId,
    })
    .returning();

  return createdIssuer;
}

export async function createCoin({
  createdAt,
  issuerId,
  title,
  updatedAt = createdAt,
}: CreateCoinInput) {
  const [createdCoin] = await db
    .insert(coin)
    .values({
      createdAt,
      issuerId,
      title,
      updatedAt,
    })
    .returning();

  return createdCoin;
}
