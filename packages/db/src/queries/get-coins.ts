import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

const defaultGetCoinsLimit = 10
const parentIssuer = alias(issuer, "parent_issuer")
const getCoinsSelection = {
  id: coin.id,
  title: coin.title,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
  issuerId: issuer.id,
  issuerCode: issuer.code,
  issuerName: issuer.name,
  issuerCreatedAt: issuer.createdAt,
  issuerUpdatedAt: issuer.updatedAt,
  parentIssuerId: parentIssuer.id,
  parentIssuerCode: parentIssuer.code,
  parentIssuerName: parentIssuer.name,
  parentIssuerCreatedAt: parentIssuer.createdAt,
  parentIssuerUpdatedAt: parentIssuer.updatedAt,
  rulerOrder: coinRuler.rulerOrder,
  rulerId: ruler.id,
  rulerCode: ruler.code,
  rulerName: ruler.name,
  rulerCreatedAt: ruler.createdAt,
  rulerUpdatedAt: ruler.updatedAt,
  rulerGroupId: rulerGroup.id,
  rulerGroupCode: rulerGroup.code,
  rulerGroupName: rulerGroup.name,
  rulerGroupCreatedAt: rulerGroup.createdAt,
  rulerGroupUpdatedAt: rulerGroup.updatedAt,
  referenceId: coinReference.id,
  referenceType: sql<"catalogue" | null>`case when ${coinReference.id} is null then null else 'catalogue' end`,
  referenceNumber: coinReference.number,
  referenceCreatedAt: coinReference.createdAt,
  referenceUpdatedAt: coinReference.updatedAt,
  referenceCatalogueId: catalogue.id,
  referenceCatalogueCode: catalogue.code,
  referenceCatalogueTitle: catalogue.title,
  referenceCatalogueCreatedAt: catalogue.createdAt,
  referenceCatalogueUpdatedAt: catalogue.updatedAt,
}

export type GetCoinsOptions = {
  limit?: number
  issuerCode?: string
  rulerCode?: string
  catalogueCode?: string
  referenceNumber?: string
}

type CoinFilterOptions = Pick<
  GetCoinsOptions,
  "issuerCode" | "rulerCode" | "catalogueCode" | "referenceNumber"
>

function buildCoinFilter({
  issuerCode,
  rulerCode,
  catalogueCode,
  referenceNumber,
}: CoinFilterOptions): SQL | undefined {
  const filters = [
    issuerCode === undefined ? undefined : buildIssuerTreeFilter(issuerCode),
    rulerCode === undefined ? undefined : buildRulerFilter(rulerCode),
    buildCatalogueReferenceFilter({
      catalogueCode,
      referenceNumber,
    }),
  ].filter((filter): filter is SQL => filter !== undefined)

  if (filters.length === 0) {
    return undefined
  }

  if (filters.length === 1) {
    return filters[0]
  }

  return and(...filters)
}

function buildLimitedCoinsQuery(
  database: typeof db,
  {
    limit,
    issuerCode,
    rulerCode,
    catalogueCode,
    referenceNumber,
  }: { limit: number } & CoinFilterOptions
) {
  const filter = buildCoinFilter({
    issuerCode,
    rulerCode,
    catalogueCode,
    referenceNumber,
  })

  const baseQuery = database
    .select({
      id: coin.id,
    })
    .from(coin)
    .orderBy(desc(coin.createdAt), desc(coin.id))
    .limit(limit)

  if (filter === undefined) {
    return baseQuery.as("limited_coins")
  }

  return baseQuery.where(filter).as("limited_coins")
}

function buildIssuerTreeFilter(issuerCode: string): SQL {
  return sql`
    ${coin.issuerId} in (
      with recursive issuer_tree(id) as (
        select "issuer"."id"
        from "issuer"
        where "issuer"."code" = ${issuerCode}
        union all
        select "child_issuer"."id"
        from "issuer" as "child_issuer"
        inner join issuer_tree on "child_issuer"."parent_issuer_id" = issuer_tree.id
      )
      select issuer_tree.id
      from issuer_tree
    )
  `
}

function buildRulerFilter(rulerCode: string): SQL {
  return sql`
    ${coin.id} in (
      select "coin_ruler"."coin_id"
      from "coin_ruler"
      inner join "ruler" on "coin_ruler"."ruler_id" = "ruler"."id"
      where "ruler"."code" = ${rulerCode}
    )
  `
}

type CatalogueReferenceFilterOptions = Pick<
  GetCoinsOptions,
  "catalogueCode" | "referenceNumber"
>

function buildCatalogueReferenceFilter({
  catalogueCode,
  referenceNumber,
}: CatalogueReferenceFilterOptions): SQL | undefined {
  const normalizedCatalogueCode = normalizeFilterValue(catalogueCode)
  const normalizedReferenceNumber = normalizeReferenceNumberPrefix(referenceNumber)
  const referenceFilters: SQL[] = []

  if (normalizedCatalogueCode !== undefined) {
    referenceFilters.push(
      sql`lower(${catalogue.code}) = ${normalizedCatalogueCode.toLowerCase()}`
    )
  }

  if (normalizedReferenceNumber !== undefined) {
    referenceFilters.push(
      sql`${buildNormalizedReferenceNumberExpression()} like ${`${normalizedReferenceNumber}%`}`
    )
  }

  if (referenceFilters.length === 0) {
    return undefined
  }

  return sql`
    ${coin.id} in (
      select ${coinReference.coinId}
      from "coin_reference"
      inner join "catalogue" on ${coinReference.catalogueId} = ${catalogue.id}
      where ${sql.join(referenceFilters, sql` and `)}
    )
  `
}

function buildNormalizedReferenceNumberExpression(): SQL {
  return sql`lower(regexp_replace(btrim(${coinReference.number}), '\s+', ' ', 'g'))`
}

function normalizeFilterValue(value: string | undefined) {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue : undefined
}

function normalizeReferenceNumberPrefix(value: string | undefined) {
  const normalizedValue = normalizeFilterValue(value)

  return normalizedValue?.replace(/\s+/g, " ").toLowerCase()
}

export function buildGetCoinsQuery(
  database: typeof db,
  options: GetCoinsOptions = {}
) {
  const {
    limit = defaultGetCoinsLimit,
    issuerCode,
    rulerCode,
    catalogueCode,
    referenceNumber,
  } = options

  const limitedCoins = buildLimitedCoinsQuery(database, {
    limit,
    issuerCode,
    rulerCode,
    catalogueCode,
    referenceNumber,
  })

  return database
    .select(getCoinsSelection)
    .from(limitedCoins)
    .innerJoin(coin, eq(limitedCoins.id, coin.id))
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .leftJoin(coinRuler, eq(coin.id, coinRuler.coinId))
    .leftJoin(ruler, eq(coinRuler.rulerId, ruler.id))
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .leftJoin(coinReference, eq(coin.id, coinReference.coinId))
    .leftJoin(catalogue, eq(coinReference.catalogueId, catalogue.id))
    .orderBy(
      desc(coin.createdAt),
      desc(coin.id),
      asc(coinRuler.rulerOrder),
      asc(ruler.id),
      asc(catalogue.title),
      asc(coinReference.number),
      asc(coinReference.id)
    )
}

export async function getCoins(options: GetCoinsOptions = {}) {
  const rows = await buildGetCoinsQuery(db, options)

  return mapGetCoinsRowsToCoinRecords(rows)
}
