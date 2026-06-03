import { eq, inArray } from "drizzle-orm"
import { closeDb, db } from "../client"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"
import { seededCoins, seededIssuers } from "./seed-data"

type IssuerIdsByCode = Map<string, string>

function getIssuerId(issuerIdsByCode: Map<string, string>, issuerCode: string) {
  const issuerId = issuerIdsByCode.get(issuerCode)

  if (!issuerId) {
    throw new Error(`Missing seeded issuer ID for ${issuerCode}`)
  }

  return issuerId
}

async function deleteSeededIssuers() {
  for (const seededIssuer of [...seededIssuers].reverse()) {
    await db.delete(issuer).where(eq(issuer.code, seededIssuer.code))
  }
}

function getIssuersReadyToInsert(
  remainingIssuers: typeof seededIssuers,
  issuerIdsByCode: IssuerIdsByCode
) {
  return remainingIssuers.filter(
    ({ parentCode }) =>
      parentCode === undefined || issuerIdsByCode.has(parentCode)
  )
}

async function insertSeededIssuer(
  issuerIdsByCode: IssuerIdsByCode,
  seededIssuer: (typeof seededIssuers)[number]
) {
  const parentIssuerId = seededIssuer.parentCode
    ? getIssuerId(issuerIdsByCode, seededIssuer.parentCode)
    : undefined

  const [insertedIssuer] = await db
    .insert(issuer)
    .values({
      name: seededIssuer.name,
      code: seededIssuer.code,
      parentIssuerId,
      createdAt: seededIssuer.createdAt,
      updatedAt: seededIssuer.updatedAt,
    })
    .returning({ id: issuer.id })

  issuerIdsByCode.set(seededIssuer.code, insertedIssuer.id)
}

function removeSeededIssuer(
  remainingIssuers: typeof seededIssuers,
  seededIssuerCode: string
) {
  const seededIssuerIndex = remainingIssuers.findIndex(
    ({ code }) => code === seededIssuerCode
  )

  remainingIssuers.splice(seededIssuerIndex, 1)
}

async function seedIssuers() {
  const issuerIdsByCode: IssuerIdsByCode = new Map()
  const remainingIssuers = [...seededIssuers]

  await deleteSeededIssuers()

  while (remainingIssuers.length > 0) {
    const issuersReadyToInsert = getIssuersReadyToInsert(
      remainingIssuers,
      issuerIdsByCode
    )

    if (issuersReadyToInsert.length === 0) {
      throw new Error("Unable to resolve seeded issuer parents")
    }

    for (const seededIssuer of issuersReadyToInsert) {
      await insertSeededIssuer(issuerIdsByCode, seededIssuer)
      removeSeededIssuer(remainingIssuers, seededIssuer.code)
    }
  }

  return issuerIdsByCode
}

async function seedCoins() {
  await db.delete(coin).where(
    inArray(
      coin.title,
      seededCoins.map(({ title }) => title)
    )
  )
  const issuerIdsByCode = await seedIssuers()

  await db.insert(coin).values(
    seededCoins.map(({ issuerCode, ...seededCoin }) => ({
      ...seededCoin,
      issuerId: getIssuerId(issuerIdsByCode, issuerCode),
    }))
  )
}

try {
  await seedCoins()
} finally {
  await closeDb()
}
