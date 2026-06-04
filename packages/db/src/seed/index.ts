import { eq, inArray } from "drizzle-orm"
import { closeDb, db } from "../client"
import { coin } from "../schema/coin"
import { coinRuler } from "../schema/coin-ruler"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import {
  seededCoinRulers,
  seededCoins,
  seededIssuers,
  seededRulerGroups,
  seededRulers,
} from "./seed-data"

type IssuerIdsByCode = Map<string, string>
type RulerGroupIdsByCode = Map<string, string>
type RulerIdsByCode = Map<string, string>
type CoinIdsByTitle = Map<string, string>

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

async function deleteSeededRulers() {
  for (const seededRuler of [...seededRulers].reverse()) {
    await db.delete(ruler).where(eq(ruler.code, seededRuler.code))
  }
}

async function deleteSeededRulerGroups() {
  for (const seededRulerGroup of [...seededRulerGroups].reverse()) {
    await db
      .delete(rulerGroup)
      .where(eq(rulerGroup.code, seededRulerGroup.code))
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

function getRulerGroupId(
  rulerGroupIdsByCode: RulerGroupIdsByCode,
  rulerGroupCode: string
) {
  const rulerGroupId = rulerGroupIdsByCode.get(rulerGroupCode)

  if (!rulerGroupId) {
    throw new Error(`Missing seeded ruler group ID for ${rulerGroupCode}`)
  }

  return rulerGroupId
}

async function seedRulerGroups() {
  const rulerGroupIdsByCode: RulerGroupIdsByCode = new Map()

  await deleteSeededRulerGroups()

  for (const seededRulerGroup of seededRulerGroups) {
    const [insertedRulerGroup] = await db
      .insert(rulerGroup)
      .values(seededRulerGroup)
      .returning({ id: rulerGroup.id })

    rulerGroupIdsByCode.set(seededRulerGroup.code, insertedRulerGroup.id)
  }

  return rulerGroupIdsByCode
}

async function seedRulers() {
  const rulerIdsByCode: RulerIdsByCode = new Map()

  await deleteSeededRulers()
  const rulerGroupIdsByCode = await seedRulerGroups()

  for (const seededRuler of seededRulers) {
    const { rulerGroupCode, ...seededRulerValues } = seededRuler

    const [insertedRuler] = await db
      .insert(ruler)
      .values({
        ...seededRulerValues,
        rulerGroupId: rulerGroupCode
          ? getRulerGroupId(rulerGroupIdsByCode, rulerGroupCode)
          : undefined,
      })
      .returning({ id: ruler.id })

    rulerIdsByCode.set(seededRuler.code, insertedRuler.id)
  }

  return rulerIdsByCode
}

function getCoinId(coinIdsByTitle: CoinIdsByTitle, coinTitle: string) {
  const coinId = coinIdsByTitle.get(coinTitle)

  if (!coinId) {
    throw new Error(`Missing seeded coin ID for ${coinTitle}`)
  }

  return coinId
}

function getRulerId(rulerIdsByCode: RulerIdsByCode, rulerCode: string) {
  const rulerId = rulerIdsByCode.get(rulerCode)

  if (!rulerId) {
    throw new Error(`Missing seeded ruler ID for ${rulerCode}`)
  }

  return rulerId
}

async function seedCoins() {
  await db.delete(coin).where(
    inArray(
      coin.title,
      seededCoins.map(({ title }) => title)
    )
  )
  const issuerIdsByCode = await seedIssuers()
  const insertedCoins = await db
    .insert(coin)
    .values(
      seededCoins.map(({ issuerCode, ...seededCoin }) => ({
        ...seededCoin,
        issuerId: getIssuerId(issuerIdsByCode, issuerCode),
      }))
    )
    .returning({ id: coin.id, title: coin.title })
  const coinIdsByTitle: CoinIdsByTitle = new Map(
    insertedCoins.map((insertedCoin) => [insertedCoin.title, insertedCoin.id])
  )
  const rulerIdsByCode = await seedRulers()

  await db.insert(coinRuler).values(
    seededCoinRulers.map((seededCoinRuler) => ({
      coinId: getCoinId(coinIdsByTitle, seededCoinRuler.coinTitle),
      rulerId: getRulerId(rulerIdsByCode, seededCoinRuler.rulerCode),
      rulerOrder: seededCoinRuler.rulerOrder,
    }))
  )
}

try {
  await seedCoins()
} finally {
  await closeDb()
}
