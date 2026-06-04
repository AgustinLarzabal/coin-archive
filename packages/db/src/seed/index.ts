import { pathToFileURL } from "node:url"
import { eq, inArray } from "drizzle-orm"
import { closeDb, db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import {
  seededCatalogues,
  seededCoinReferences,
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
type CatalogueIdsByCode = Map<string, string>

function getRequiredSeededId(
  idsByKey: Map<string, string>,
  key: string,
  entityName: string
) {
  const id = idsByKey.get(key)

  if (!id) {
    throw new Error(`Missing seeded ${entityName} ID for ${key}`)
  }

  return id
}

async function deleteSeededRecords(
  values: readonly string[],
  deleteRecord: (value: string) => Promise<unknown>
) {
  for (const value of [...values].reverse()) {
    await deleteRecord(value)
  }
}

async function deleteSeededIssuers() {
  await deleteSeededRecords(
    seededIssuers.map(({ code }) => code),
    (code) => db.delete(issuer).where(eq(issuer.code, code))
  )
}

async function deleteSeededRulers() {
  await deleteSeededRecords(
    seededRulers.map(({ code }) => code),
    (code) => db.delete(ruler).where(eq(ruler.code, code))
  )
}

async function deleteSeededRulerGroups() {
  await deleteSeededRecords(
    seededRulerGroups.map(({ code }) => code),
    (code) => db.delete(rulerGroup).where(eq(rulerGroup.code, code))
  )
}

async function deleteSeededCatalogues() {
  await deleteSeededRecords(
    seededCatalogues.map(({ code }) => code),
    (code) => db.delete(catalogue).where(eq(catalogue.code, code))
  )
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
    ? getRequiredSeededId(issuerIdsByCode, seededIssuer.parentCode, "issuer")
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
          ? getRequiredSeededId(
              rulerGroupIdsByCode,
              rulerGroupCode,
              "ruler group"
            )
          : undefined,
      })
      .returning({ id: ruler.id })

    rulerIdsByCode.set(seededRuler.code, insertedRuler.id)
  }

  return rulerIdsByCode
}

async function seedCatalogues() {
  const catalogueIdsByCode: CatalogueIdsByCode = new Map()

  await deleteSeededCatalogues()

  for (const seededCatalogue of seededCatalogues) {
    const [insertedCatalogue] = await db
      .insert(catalogue)
      .values(seededCatalogue)
      .returning({ id: catalogue.id })

    catalogueIdsByCode.set(seededCatalogue.code, insertedCatalogue.id)
  }

  return catalogueIdsByCode
}

export async function seedDatabase() {
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
        issuerId: getRequiredSeededId(issuerIdsByCode, issuerCode, "issuer"),
      }))
    )
    .returning({ id: coin.id, title: coin.title })
  const coinIdsByTitle: CoinIdsByTitle = new Map(
    insertedCoins.map((insertedCoin) => [insertedCoin.title, insertedCoin.id])
  )
  const rulerIdsByCode = await seedRulers()
  const catalogueIdsByCode = await seedCatalogues()

  await db.insert(coinRuler).values(
    seededCoinRulers.map((seededCoinRuler) => ({
      coinId: getRequiredSeededId(
        coinIdsByTitle,
        seededCoinRuler.coinTitle,
        "coin"
      ),
      rulerId: getRequiredSeededId(
        rulerIdsByCode,
        seededCoinRuler.rulerCode,
        "ruler"
      ),
      rulerOrder: seededCoinRuler.rulerOrder,
    }))
  )

  await db.insert(coinReference).values(
    seededCoinReferences.map((seededCoinReference) => ({
      coinId: getRequiredSeededId(
        coinIdsByTitle,
        seededCoinReference.coinTitle,
        "coin"
      ),
      catalogueId: getRequiredSeededId(
        catalogueIdsByCode,
        seededCoinReference.catalogueCode,
        "catalogue"
      ),
      number: seededCoinReference.number,
      createdAt: seededCoinReference.createdAt,
      updatedAt: seededCoinReference.updatedAt,
    }))
  )
}

function isExecutedDirectly() {
  const entrypointPath = process.argv[1]

  return (
    entrypointPath !== undefined &&
    import.meta.url === pathToFileURL(entrypointPath).href
  )
}

if (isExecutedDirectly()) {
  try {
    await seedDatabase()
  } finally {
    await closeDb()
  }
}
