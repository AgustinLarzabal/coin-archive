import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { distribution } from "../schema/distribution"
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
  minYear: coin.minYear,
  maxYear: coin.maxYear,
  weight: coin.weight,
  diameter: coin.diameter,
  thickness: coin.thickness,
  distributionId: distribution.id,
  distributionCode: distribution.code,
  distributionName: distribution.name,
  distributionCreatedAt: distribution.createdAt,
  distributionUpdatedAt: distribution.updatedAt,
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
  referenceType: sql<
    "catalogue" | null
  >`case when ${coinReference.id} is null then null else 'catalogue' end`,
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
  catalogueCode?: string
  distributionCode?: string
  maxDiameter?: number
  maxThickness?: number
  maxWeight?: number
  minDiameter?: number
  minThickness?: number
  minWeight?: number
  fromYear?: number
  issuerCode?: string
  limit?: number
  referenceNumber?: string
  rulerCode?: string
  toYear?: number
}

type CoinFilterOptions = Pick<
  GetCoinsOptions,
  | "distributionCode"
  | "maxDiameter"
  | "maxThickness"
  | "maxWeight"
  | "minDiameter"
  | "minThickness"
  | "minWeight"
  | "fromYear"
  | "issuerCode"
  | "rulerCode"
  | "catalogueCode"
  | "referenceNumber"
  | "toYear"
>

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

function buildCoinFilter({
  distributionCode,
  maxDiameter,
  maxThickness,
  maxWeight,
  minDiameter,
  minThickness,
  minWeight,
  fromYear,
  issuerCode,
  rulerCode,
  catalogueCode,
  referenceNumber,
  toYear,
}: CoinFilterOptions): SQL | undefined {
  const filters = [
    buildDistributionFilter(distributionCode),
    issuerCode === undefined ? undefined : buildIssuerTreeFilter(issuerCode),
    rulerCode === undefined ? undefined : buildRulerFilter(rulerCode),
    buildCatalogueReferenceFilter({
      catalogueCode,
      referenceNumber,
    }),
    buildIssueYearRangeFilter({
      fromYear,
      toYear,
    }),
    buildMeasurementRangeFilter({
      column: coin.weight,
      minValue: minWeight,
      maxValue: maxWeight,
    }),
    buildMeasurementRangeFilter({
      column: coin.diameter,
      minValue: minDiameter,
      maxValue: maxDiameter,
    }),
    buildMeasurementRangeFilter({
      column: coin.thickness,
      minValue: minThickness,
      maxValue: maxThickness,
    }),
  ].filter(isDefined)

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
  options: { limit: number } & CoinFilterOptions
) {
  const { limit, ...filterOptions } = options
  const filter = buildCoinFilter(filterOptions)

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

function buildDistributionFilter(
  distributionCode: string | undefined
): SQL | undefined {
  const normalizedDistributionCode = normalizeCodeFilter(distributionCode)

  if (normalizedDistributionCode === undefined) {
    return undefined
  }

  return sql`
    ${coin.distributionId} in (
      select ${distribution.id}
      from "distribution"
      where lower(${distribution.code}) = ${normalizedDistributionCode}
    )
  `
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

type IssueYearRangeFilterOptions = Pick<GetCoinsOptions, "fromYear" | "toYear">
type MeasurementRangeFilterOptions = {
  column: typeof coin.weight | typeof coin.diameter | typeof coin.thickness
  minValue: number | undefined
  maxValue: number | undefined
}

function buildCatalogueReferenceFilter({
  catalogueCode,
  referenceNumber,
}: CatalogueReferenceFilterOptions): SQL | undefined {
  const normalizedCatalogueCode = normalizeCatalogueCode(catalogueCode)
  const normalizedReferenceNumber =
    normalizeReferenceNumberPrefix(referenceNumber)
  const referenceFilters: SQL[] = []

  if (normalizedCatalogueCode !== undefined) {
    referenceFilters.push(
      sql`lower(${catalogue.code}) = ${normalizedCatalogueCode}`
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

function normalizeCodeFilter(value: string | undefined) {
  return normalizeFilterValue(value)?.toLowerCase()
}

function normalizeCatalogueCode(value: string | undefined) {
  return normalizeCodeFilter(value)
}

function normalizeReferenceNumberPrefix(value: string | undefined) {
  const normalizedValue = normalizeFilterValue(value)

  return normalizedValue?.replace(/\s+/g, " ").toLowerCase()
}

function buildIssueYearRangeFilter({
  fromYear,
  toYear,
}: IssueYearRangeFilterOptions): SQL | undefined {
  if (fromYear === undefined && toYear === undefined) {
    return undefined
  }

  const filters = [
    sql`${coin.minYear} is not null`,
    sql`${coin.maxYear} is not null`,
    fromYear === undefined ? undefined : sql`${coin.maxYear} >= ${fromYear}`,
    toYear === undefined ? undefined : sql`${coin.minYear} <= ${toYear}`,
  ].filter(isDefined)

  return and(...filters)!
}

function buildMeasurementRangeFilter({
  column,
  minValue,
  maxValue,
}: MeasurementRangeFilterOptions): SQL | undefined {
  if (minValue === undefined && maxValue === undefined) {
    return undefined
  }

  const filters = [
    sql`${column} is not null`,
    minValue === undefined ? undefined : sql`${column} >= ${minValue}`,
    maxValue === undefined ? undefined : sql`${column} <= ${maxValue}`,
  ].filter(isDefined)

  return and(...filters)!
}

export function buildGetCoinsQuery(
  database: typeof db,
  options: GetCoinsOptions = {}
) {
  const { limit = defaultGetCoinsLimit, ...filterOptions } = options

  const limitedCoins = buildLimitedCoinsQuery(database, {
    limit,
    ...filterOptions,
  })

  return database
    .select(getCoinsSelection)
    .from(limitedCoins)
    .innerJoin(coin, eq(limitedCoins.id, coin.id))
    .innerJoin(distribution, eq(coin.distributionId, distribution.id))
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
