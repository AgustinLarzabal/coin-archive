import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
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
  faceValueText: coin.faceValueText,
  faceValueNumericValue: coin.faceValueNumericValue,
  currencyId: currency.id,
  currencyCode: currency.code,
  currencyName: currency.name,
  currencyFullName: currency.fullName,
  currencyCreatedAt: currency.createdAt,
  currencyUpdatedAt: currency.updatedAt,
  weight: coin.weight,
  diameter: coin.diameter,
  thickness: coin.thickness,
  compositionId: composition.id,
  compositionCode: composition.code,
  compositionName: composition.name,
  compositionDescription: composition.description,
  compositionCreatedAt: composition.createdAt,
  compositionUpdatedAt: composition.updatedAt,
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
  mintId: mint.id,
  mintCode: mint.code,
  mintName: mint.name,
  mintCreatedAt: mint.createdAt,
  mintUpdatedAt: mint.updatedAt,
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
  compositionCode?: string
  currencyCode?: string
  distributionCode?: string
  maxDiameter?: number
  maxThickness?: number
  maxWeight?: number
  maxValue?: number
  mintCode?: string
  minDiameter?: number
  minThickness?: number
  minWeight?: number
  minValue?: number
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
  | "compositionCode"
  | "currencyCode"
  | "maxDiameter"
  | "maxThickness"
  | "maxWeight"
  | "maxValue"
  | "mintCode"
  | "minDiameter"
  | "minThickness"
  | "minWeight"
  | "minValue"
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
  compositionCode,
  currencyCode,
  maxDiameter,
  maxThickness,
  maxWeight,
  maxValue,
  mintCode,
  minDiameter,
  minThickness,
  minWeight,
  minValue,
  fromYear,
  issuerCode,
  rulerCode,
  catalogueCode,
  referenceNumber,
  toYear,
}: CoinFilterOptions): SQL | undefined {
  const rangeFilters = [
    {
      column: coin.faceValueNumericValue,
      minValue,
      maxValue,
    },
    {
      column: coin.weight,
      minValue: minWeight,
      maxValue: maxWeight,
    },
    {
      column: coin.diameter,
      minValue: minDiameter,
      maxValue: maxDiameter,
    },
    {
      column: coin.thickness,
      minValue: minThickness,
      maxValue: maxThickness,
    },
  ] as const
  const filters = [
    buildDistributionFilter(distributionCode),
    buildCompositionFilter(compositionCode),
    buildCurrencyFilter(currencyCode),
    buildMintFilter(mintCode),
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
    ...rangeFilters.map(({ column, minValue, maxValue }) =>
      buildMeasurementRangeFilter({
        column,
        minValue,
        maxValue,
      })
    ),
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
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.distributionId,
    relatedCode: distributionCode,
    relatedCodeColumn: distribution.code,
    relatedIdColumn: distribution.id,
    relatedTableName: "distribution",
  })
}

function buildCompositionFilter(
  compositionCode: string | undefined
): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.compositionId,
    relatedCode: compositionCode,
    relatedCodeColumn: composition.code,
    relatedIdColumn: composition.id,
    relatedTableName: "composition",
  })
}

function buildCurrencyFilter(
  currencyCode: string | undefined
): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.currencyId,
    relatedCode: currencyCode,
    relatedCodeColumn: currency.code,
    relatedIdColumn: currency.id,
    relatedTableName: "currency",
  })
}

function buildMintFilter(mintCode: string | undefined): SQL | undefined {
  const normalizedMintCode = normalizeCodeFilter(mintCode)

  if (normalizedMintCode === undefined) {
    return undefined
  }

  return sql`
    ${coin.id} in (
      select ${coinMint.coinId}
      from "coin_mint"
      inner join "mint" on ${coinMint.mintId} = ${mint.id}
      where lower(${mint.code}) = ${normalizedMintCode}
    )
  `
}

type RelatedCodeFilterOptions = {
  foreignKeyColumn:
    | typeof coin.distributionId
    | typeof coin.compositionId
    | typeof coin.currencyId
  relatedCode: string | undefined
  relatedCodeColumn:
    | typeof distribution.code
    | typeof composition.code
    | typeof currency.code
  relatedIdColumn:
    | typeof distribution.id
    | typeof composition.id
    | typeof currency.id
  relatedTableName: "composition" | "currency" | "distribution"
}

function buildRelatedCodeFilter({
  foreignKeyColumn,
  relatedCode,
  relatedCodeColumn,
  relatedIdColumn,
  relatedTableName,
}: RelatedCodeFilterOptions): SQL | undefined {
  const normalizedRelatedCode = normalizeCodeFilter(relatedCode)

  if (normalizedRelatedCode === undefined) {
    return undefined
  }

  return sql`
    ${foreignKeyColumn} in (
      select ${relatedIdColumn}
      from ${sql.raw(`"${relatedTableName}"`)}
      where lower(${relatedCodeColumn}) = ${normalizedRelatedCode}
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
  column:
    | typeof coin.weight
    | typeof coin.diameter
    | typeof coin.thickness
    | typeof coin.faceValueNumericValue
  minValue: number | undefined
  maxValue: number | undefined
}

function buildCatalogueReferenceFilter({
  catalogueCode,
  referenceNumber,
}: CatalogueReferenceFilterOptions): SQL | undefined {
  const normalizedCatalogueCode = normalizeCodeFilter(catalogueCode)
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
    .innerJoin(composition, eq(coin.compositionId, composition.id))
    .innerJoin(currency, eq(coin.currencyId, currency.id))
    .innerJoin(distribution, eq(coin.distributionId, distribution.id))
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .leftJoin(coinMint, eq(coin.id, coinMint.coinId))
    .leftJoin(mint, eq(coinMint.mintId, mint.id))
    .leftJoin(coinRuler, eq(coin.id, coinRuler.coinId))
    .leftJoin(ruler, eq(coinRuler.rulerId, ruler.id))
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .leftJoin(coinReference, eq(coin.id, coinReference.coinId))
    .leftJoin(catalogue, eq(coinReference.catalogueId, catalogue.id))
    .orderBy(
      desc(coin.createdAt),
      desc(coin.id),
      asc(mint.name),
      asc(mint.code),
      asc(mint.id),
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
