import { pathToFileURL } from "node:url"
import { eq, inArray, sql } from "drizzle-orm"
import { closeDb, db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import {
  seededCatalogues,
  seededCoinReferences,
  seededCoinRulers,
  seededCoins,
  seededCompositions,
  seededCurrencies,
  seededDistributions,
  seededIssuers,
  seededRulerGroups,
  seededRulers,
} from "./seed-data"

type IssuerIdsByCode = Map<string, string>
type RulerGroupIdsByCode = Map<string, string>
type RulerIdsByCode = Map<string, string>
type CoinIdsByTitle = Map<string, string>
type CatalogueIdsByCode = Map<string, string>
type CompositionIdsByCode = Map<string, string>
type DistributionIdsByCode = Map<string, string>
type CurrencyIdsByCode = Map<string, string>

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

async function deleteSeededCoins() {
  await deleteSeededRecords(
    seededCoins.map(({ title }) => title),
    (title) => db.delete(coin).where(eq(coin.title, title))
  )
}

async function deleteSeededCompositions() {
  await deleteSeededRecords(
    seededCompositions.map(({ code }) => code),
    (code) => db.delete(composition).where(eq(composition.code, code))
  )
}

async function deleteSeededCurrencies() {
  await deleteSeededRecords(
    seededCurrencies.map(({ code }) => code),
    (code) => db.delete(currency).where(eq(currency.code, code))
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

  if (seededIssuerIndex < 0) {
    throw new Error(`Missing seeded issuer ${seededIssuerCode}`)
  }

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

async function seedCompositions() {
  const compositionIdsByCode: CompositionIdsByCode = new Map()

  await deleteSeededCompositions()

  for (const seededComposition of seededCompositions) {
    const [insertedComposition] = await db
      .insert(composition)
      .values(seededComposition)
      .returning({ id: composition.id })

    compositionIdsByCode.set(seededComposition.code, insertedComposition.id)
  }

  return compositionIdsByCode
}

async function seedCurrencies() {
  const currencyIdsByCode: CurrencyIdsByCode = new Map()

  await deleteSeededCurrencies()

  for (const seededCurrency of seededCurrencies) {
    const [insertedCurrency] = await db
      .insert(currency)
      .values(seededCurrency)
      .returning({ id: currency.id })

    currencyIdsByCode.set(seededCurrency.code, insertedCurrency.id)
  }

  return currencyIdsByCode
}

async function seedDistributions() {
  for (const seededDistribution of seededDistributions) {
    await db.execute(sql`
      insert into "distribution" (
        "code",
        "name",
        "created_at",
        "updated_at"
      ) values (
        ${seededDistribution.code},
        ${seededDistribution.name},
        ${sql.param(seededDistribution.createdAt, distribution.createdAt)},
        ${sql.param(seededDistribution.updatedAt, distribution.updatedAt)}
      )
      on conflict ((lower("code"))) do update
      set
        "name" = excluded."name",
        "updated_at" = excluded."updated_at"
    `)
  }

  const insertedDistributions = await db
    .select({
      id: distribution.id,
      code: distribution.code,
    })
    .from(distribution)
    .where(
      inArray(
        distribution.code,
        seededDistributions.map(({ code }) => code)
      )
    )

  return new Map(
    insertedDistributions.map((insertedDistribution) => [
      insertedDistribution.code,
      insertedDistribution.id,
    ])
  ) satisfies DistributionIdsByCode
}

async function seedCoins(
  compositionIdsByCode: CompositionIdsByCode,
  currencyIdsByCode: CurrencyIdsByCode,
  issuerIdsByCode: IssuerIdsByCode,
  distributionIdsByCode: DistributionIdsByCode
) {
  await db.delete(coin).where(
    inArray(
      coin.title,
      seededCoins.map(({ title }) => title)
    )
  )

  const insertedCoins = await db
    .insert(coin)
    .values(
      seededCoins.map((seededCoin) =>
        mapSeededCoinToInsertValues(
          seededCoin,
          compositionIdsByCode,
          currencyIdsByCode,
          issuerIdsByCode,
          distributionIdsByCode
        )
      )
    )
    .returning({ id: coin.id, title: coin.title })
  const coinIdsByTitle: CoinIdsByTitle = new Map(
    insertedCoins.map((insertedCoin) => [insertedCoin.title, insertedCoin.id])
  )

  return coinIdsByTitle
}

function mapSeededCoinToInsertValues(
  seededCoin: (typeof seededCoins)[number],
  compositionIdsByCode: CompositionIdsByCode,
  currencyIdsByCode: CurrencyIdsByCode,
  issuerIdsByCode: IssuerIdsByCode,
  distributionIdsByCode: DistributionIdsByCode
) {
  const {
    issuerCode,
    distributionCode,
    compositionCode,
    currencyCode,
    ...coinValues
  } = seededCoin

  return {
    ...coinValues,
    compositionId: getRequiredSeededId(
      compositionIdsByCode,
      compositionCode,
      "composition"
    ),
    currencyId: getRequiredSeededId(currencyIdsByCode, currencyCode, "currency"),
    distributionId: getRequiredSeededId(
      distributionIdsByCode,
      distributionCode,
      "distribution"
    ),
    issuerId: getRequiredSeededId(issuerIdsByCode, issuerCode, "issuer"),
  }
}

async function seedCoinRulers(
  coinIdsByTitle: CoinIdsByTitle,
  rulerIdsByCode: RulerIdsByCode
) {
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
}

async function seedCoinReferences(
  coinIdsByTitle: CoinIdsByTitle,
  catalogueIdsByCode: CatalogueIdsByCode
) {
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

export async function seedDatabase() {
  await deleteSeededCoins()

  const issuerIdsByCode = await seedIssuers()
  const compositionIdsByCode = await seedCompositions()
  const currencyIdsByCode = await seedCurrencies()
  const distributionIdsByCode = await seedDistributions()
  const coinIdsByTitle = await seedCoins(
    compositionIdsByCode,
    currencyIdsByCode,
    issuerIdsByCode,
    distributionIdsByCode
  )
  const rulerIdsByCode = await seedRulers()
  const catalogueIdsByCode = await seedCatalogues()

  await seedCoinRulers(coinIdsByTitle, rulerIdsByCode)
  await seedCoinReferences(coinIdsByTitle, catalogueIdsByCode)
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
