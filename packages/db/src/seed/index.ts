import { eq, inArray } from "drizzle-orm";
import { closeDb, db } from "../client";
import { coin } from "../schema/coin";
import { issuer } from "../schema/issuer";
import { seededCoins, seededIssuers } from "./seed-data";

function getIssuerId(issuerIdsByCode: Map<string, string>, issuerCode: string) {
  const issuerId = issuerIdsByCode.get(issuerCode);

  if (!issuerId) {
    throw new Error(`Missing seeded issuer ID for ${issuerCode}`);
  }

  return issuerId;
}

async function seedIssuers() {
  const issuerIdsByCode = new Map<string, string>();
  const remainingIssuers = [...seededIssuers];

  for (const seededIssuer of [...seededIssuers].reverse()) {
    await db.delete(issuer).where(eq(issuer.code, seededIssuer.code));
  }

  while (remainingIssuers.length > 0) {
    const issuersReadyToInsert = remainingIssuers.filter(
      ({ parentCode }) => parentCode === undefined || issuerIdsByCode.has(parentCode),
    );

    if (issuersReadyToInsert.length === 0) {
      throw new Error("Unable to resolve seeded issuer parents");
    }

    for (const seededIssuer of issuersReadyToInsert) {
      const [insertedIssuer] = await db.insert(issuer).values({
        displayName: seededIssuer.displayName,
        code: seededIssuer.code,
        parentIssuerId: seededIssuer.parentCode
          ? issuerIdsByCode.get(seededIssuer.parentCode)
          : undefined,
        createdAt: seededIssuer.createdAt,
        updatedAt: seededIssuer.updatedAt,
      }).returning({ id: issuer.id });

      issuerIdsByCode.set(seededIssuer.code, insertedIssuer.id);

      const seededIssuerIndex = remainingIssuers.findIndex(
        ({ code }) => code === seededIssuer.code,
      );
      remainingIssuers.splice(seededIssuerIndex, 1);
    }
  }

  return issuerIdsByCode;
}

async function seedCoins() {
  await db.delete(coin).where(inArray(coin.title, seededCoins.map(({ title }) => title)));
  const issuerIdsByCode = await seedIssuers();

  await db.insert(coin).values(seededCoins.map(({ issuerCode, ...seededCoin }) => ({
    ...seededCoin,
    issuerId: getIssuerId(issuerIdsByCode, issuerCode),
  })));
}

try {
  await seedCoins();
} finally {
  await closeDb();
}
