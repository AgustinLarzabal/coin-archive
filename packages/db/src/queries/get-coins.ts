import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinFace } from "../schema/coin-face"
import { coinFaceEngraver } from "../schema/coin-face-engraver"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinTheme } from "../schema/coin-theme"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { shape } from "../schema/shape"
import { technique } from "../schema/technique"
import { theme } from "../schema/theme"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

const defaultGetCoinsLimit = 10
export const demonetizationFilterValues = [
  "demonetized",
  "not-demonetized",
  "unknown",
] as const

export type DemonetizationFilterValue =
  (typeof demonetizationFilterValues)[number]

const parentIssuer = alias(issuer, "parent_issuer")
const obverseFace = alias(coinFace, "obverse_face")
const obverseFaceEngraver = alias(coinFaceEngraver, "obverse_face_engraver")
const obverseEngraver = alias(engraver, "obverse_engraver")
const reverseFace = alias(coinFace, "reverse_face")
const reverseFaceEngraver = alias(coinFaceEngraver, "reverse_face_engraver")
const reverseEngraver = alias(engraver, "reverse_engraver")
const getCoinsSelection = {
  id: coin.id,
  title: coin.title,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
  comments: coin.comments,
  isDemonetized: coin.isDemonetized,
  mintage: coin.mintage,
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
  orientationId: orientation.id,
  orientationCode: orientation.code,
  orientationName: orientation.name,
  orientationCreatedAt: orientation.createdAt,
  orientationUpdatedAt: orientation.updatedAt,
  edgeId: edge.id,
  edgeCode: edge.code,
  edgeName: edge.name,
  edgeDescription: coin.edgeDescription,
  edgeLettering: coin.edgeLettering,
  edgeCreatedAt: edge.createdAt,
  edgeUpdatedAt: edge.updatedAt,
  shapeId: shape.id,
  shapeCode: shape.code,
  shapeName: shape.name,
  shapeCreatedAt: shape.createdAt,
  shapeUpdatedAt: shape.updatedAt,
  rimId: rim.id,
  rimCode: rim.code,
  rimName: rim.name,
  rimCreatedAt: rim.createdAt,
  rimUpdatedAt: rim.updatedAt,
  techniqueId: technique.id,
  techniqueCode: technique.code,
  techniqueName: technique.name,
  techniqueCreatedAt: technique.createdAt,
  techniqueUpdatedAt: technique.updatedAt,
  obverseDescription: obverseFace.description,
  obverseLettering: obverseFace.lettering,
  obverseEngraverId: obverseEngraver.id,
  obverseEngraverCode: obverseEngraver.code,
  obverseEngraverName: obverseEngraver.name,
  obverseEngraverCreatedAt: obverseEngraver.createdAt,
  obverseEngraverUpdatedAt: obverseEngraver.updatedAt,
  reverseDescription: reverseFace.description,
  reverseLettering: reverseFace.lettering,
  reverseEngraverId: reverseEngraver.id,
  reverseEngraverCode: reverseEngraver.code,
  reverseEngraverName: reverseEngraver.name,
  reverseEngraverCreatedAt: reverseEngraver.createdAt,
  reverseEngraverUpdatedAt: reverseEngraver.updatedAt,
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
  themeId: theme.id,
  themeCode: theme.code,
  themeName: theme.name,
  themeCreatedAt: theme.createdAt,
  themeUpdatedAt: theme.updatedAt,
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
  demonetization?: DemonetizationFilterValue
  distributionCode?: string
  edgeCode?: string
  engraverCode?: string
  fromYear?: number
  issuerCode?: string
  limit?: number
  maxDiameter?: number
  maxThickness?: number
  maxWeight?: number
  maxValue?: number
  mintCode?: string
  minDiameter?: number
  minThickness?: number
  minWeight?: number
  minValue?: number
  orientationCode?: string
  referenceNumber?: string
  rimCode?: string
  rulerCode?: string
  shapeCode?: string
  techniqueCode?: string
  themeCode?: string
  toYear?: number
}

type CoinFilterOptions = Pick<
  GetCoinsOptions,
  | "catalogueCode"
  | "compositionCode"
  | "currencyCode"
  | "demonetization"
  | "distributionCode"
  | "edgeCode"
  | "engraverCode"
  | "fromYear"
  | "issuerCode"
  | "maxDiameter"
  | "maxThickness"
  | "maxWeight"
  | "maxValue"
  | "mintCode"
  | "minDiameter"
  | "minThickness"
  | "minWeight"
  | "minValue"
  | "orientationCode"
  | "referenceNumber"
  | "rimCode"
  | "rulerCode"
  | "shapeCode"
  | "techniqueCode"
  | "themeCode"
  | "toYear"
>

type RelatedCodeFilterOptions = {
  foreignKeyColumn:
    | typeof coin.compositionId
    | typeof coin.currencyId
    | typeof coin.distributionId
    | typeof coin.edgeId
    | typeof coin.orientationId
    | typeof coin.rimId
    | typeof coin.shapeId
    | typeof coin.techniqueId
  relatedCode: string | undefined
  relatedCodeColumn:
    | typeof composition.code
    | typeof currency.code
    | typeof distribution.code
    | typeof edge.code
    | typeof orientation.code
    | typeof rim.code
    | typeof shape.code
    | typeof technique.code
  relatedIdColumn:
    | typeof composition.id
    | typeof currency.id
    | typeof distribution.id
    | typeof edge.id
    | typeof orientation.id
    | typeof rim.id
    | typeof shape.id
    | typeof technique.id
  relatedTableName:
    | "composition"
    | "currency"
    | "distribution"
    | "edge"
    | "orientation"
    | "rim"
    | "shape"
    | "technique"
}

type AttributionCodeFilterOptions = {
  attributionCoinIdColumn: typeof coinMint.coinId | typeof coinTheme.coinId
  attributionForeignKeyColumn: typeof coinMint.mintId | typeof coinTheme.themeId
  attributionTableName: "coin_mint" | "coin_theme"
  relatedCode: string | undefined
  relatedCodeColumn: typeof mint.code | typeof theme.code
  relatedIdColumn: typeof mint.id | typeof theme.id
  relatedTableName: "mint" | "theme"
}

type CatalogueReferenceFilterOptions = Pick<
  GetCoinsOptions,
  "catalogueCode" | "referenceNumber"
>

type IssueYearRangeFilterOptions = Pick<GetCoinsOptions, "fromYear" | "toYear">

type MeasurementRangeFilterOptions = {
  column:
    | typeof coin.diameter
    | typeof coin.faceValueNumericValue
    | typeof coin.thickness
    | typeof coin.weight
  minValue: number | undefined
  maxValue: number | undefined
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

function buildCoinFilter({
  catalogueCode,
  compositionCode,
  currencyCode,
  demonetization,
  distributionCode,
  edgeCode,
  engraverCode,
  fromYear,
  issuerCode,
  maxDiameter,
  maxThickness,
  maxWeight,
  maxValue,
  mintCode,
  minDiameter,
  minThickness,
  minWeight,
  minValue,
  orientationCode,
  referenceNumber,
  rimCode,
  rulerCode,
  shapeCode,
  techniqueCode,
  themeCode,
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
    buildDemonetizationFilter(demonetization),
    buildDistributionFilter(distributionCode),
    buildEdgeFilter(edgeCode),
    buildEngraverFilter(engraverCode),
    buildCompositionFilter(compositionCode),
    buildCurrencyFilter(currencyCode),
    buildOrientationFilter(orientationCode),
    buildShapeFilter(shapeCode),
    buildRimFilter(rimCode),
    buildTechniqueFilter(techniqueCode),
    buildMintFilter(mintCode),
    buildThemeFilter(themeCode),
    buildIssuerTreeFilter(issuerCode),
    buildRulerFilter(rulerCode),
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

function buildDemonetizationFilter(
  demonetization: DemonetizationFilterValue | undefined
): SQL | undefined {
  switch (demonetization) {
    case "demonetized":
      return eq(coin.isDemonetized, true)
    case "not-demonetized":
      return eq(coin.isDemonetized, false)
    case "unknown":
      return sql`${coin.isDemonetized} is null`
    default:
      return undefined
  }
}

function buildEdgeFilter(edgeCode: string | undefined): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.edgeId,
    relatedCode: edgeCode,
    relatedCodeColumn: edge.code,
    relatedIdColumn: edge.id,
    relatedTableName: "edge",
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

function buildOrientationFilter(
  orientationCode: string | undefined
): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.orientationId,
    relatedCode: orientationCode,
    relatedCodeColumn: orientation.code,
    relatedIdColumn: orientation.id,
    relatedTableName: "orientation",
  })
}

function buildShapeFilter(shapeCode: string | undefined): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.shapeId,
    relatedCode: shapeCode,
    relatedCodeColumn: shape.code,
    relatedIdColumn: shape.id,
    relatedTableName: "shape",
  })
}

function buildRimFilter(rimCode: string | undefined): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.rimId,
    relatedCode: rimCode,
    relatedCodeColumn: rim.code,
    relatedIdColumn: rim.id,
    relatedTableName: "rim",
  })
}

function buildTechniqueFilter(
  techniqueCode: string | undefined
): SQL | undefined {
  return buildRelatedCodeFilter({
    foreignKeyColumn: coin.techniqueId,
    relatedCode: techniqueCode,
    relatedCodeColumn: technique.code,
    relatedIdColumn: technique.id,
    relatedTableName: "technique",
  })
}

function buildMintFilter(mintCode: string | undefined): SQL | undefined {
  return buildAttributionCodeFilter({
    attributionCoinIdColumn: coinMint.coinId,
    attributionForeignKeyColumn: coinMint.mintId,
    attributionTableName: "coin_mint",
    relatedCode: mintCode,
    relatedCodeColumn: mint.code,
    relatedIdColumn: mint.id,
    relatedTableName: "mint",
  })
}

function buildThemeFilter(themeCode: string | undefined): SQL | undefined {
  return buildAttributionCodeFilter({
    attributionCoinIdColumn: coinTheme.coinId,
    attributionForeignKeyColumn: coinTheme.themeId,
    attributionTableName: "coin_theme",
    relatedCode: themeCode,
    relatedCodeColumn: theme.code,
    relatedIdColumn: theme.id,
    relatedTableName: "theme",
  })
}

function buildEngraverFilter(engraverCode: string | undefined): SQL | undefined {
  const normalizedEngraverCode = normalizeCodeFilter(engraverCode)

  if (normalizedEngraverCode === undefined) {
    return undefined
  }

  return sql`
    ${coin.id} in (
      select ${coinFace.coinId}
      from "coin_face_engraver"
      inner join "coin_face"
        on ${coinFaceEngraver.coinFaceId} = ${coinFace.id}
      inner join "engraver"
        on ${coinFaceEngraver.engraverId} = ${engraver.id}
      where lower(${engraver.code}) = ${normalizedEngraverCode}
    )
  `
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

function buildAttributionCodeFilter({
  attributionCoinIdColumn,
  attributionForeignKeyColumn,
  attributionTableName,
  relatedCode,
  relatedCodeColumn,
  relatedIdColumn,
  relatedTableName,
}: AttributionCodeFilterOptions): SQL | undefined {
  const normalizedRelatedCode = normalizeCodeFilter(relatedCode)

  if (normalizedRelatedCode === undefined) {
    return undefined
  }

  return sql`
    ${coin.id} in (
      select ${attributionCoinIdColumn}
      from ${sql.raw(`"${attributionTableName}"`)}
      inner join ${sql.raw(`"${relatedTableName}"`)}
        on ${attributionForeignKeyColumn} = ${relatedIdColumn}
      where lower(${relatedCodeColumn}) = ${normalizedRelatedCode}
    )
  `
}

function buildIssuerTreeFilter(
  issuerCode: string | undefined
): SQL | undefined {
  const normalizedIssuerCode = normalizeCodeFilter(issuerCode)

  if (normalizedIssuerCode === undefined) {
    return undefined
  }

  return sql`
    ${coin.issuerId} in (
      with recursive issuer_tree(id) as (
        select "issuer"."id"
        from "issuer"
        where lower("issuer"."code") = ${normalizedIssuerCode}
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

function buildRulerFilter(rulerCode: string | undefined): SQL | undefined {
  const normalizedRulerCode = normalizeCodeFilter(rulerCode)

  if (normalizedRulerCode === undefined) {
    return undefined
  }

  return sql`
    ${coin.id} in (
      select "coin_ruler"."coin_id"
      from "coin_ruler"
      inner join "ruler" on "coin_ruler"."ruler_id" = "ruler"."id"
      where lower("ruler"."code") = ${normalizedRulerCode}
    )
  `
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
    .leftJoin(edge, eq(coin.edgeId, edge.id))
    .leftJoin(orientation, eq(coin.orientationId, orientation.id))
    .leftJoin(shape, eq(coin.shapeId, shape.id))
    .leftJoin(rim, eq(coin.rimId, rim.id))
    .leftJoin(technique, eq(coin.techniqueId, technique.id))
    .leftJoin(
      obverseFace,
      and(eq(coin.id, obverseFace.coinId), eq(obverseFace.side, "obverse"))
    )
    .leftJoin(
      obverseFaceEngraver,
      eq(obverseFace.id, obverseFaceEngraver.coinFaceId)
    )
    .leftJoin(
      obverseEngraver,
      eq(obverseFaceEngraver.engraverId, obverseEngraver.id)
    )
    .leftJoin(
      reverseFace,
      and(eq(coin.id, reverseFace.coinId), eq(reverseFace.side, "reverse"))
    )
    .leftJoin(
      reverseFaceEngraver,
      eq(reverseFace.id, reverseFaceEngraver.coinFaceId)
    )
    .leftJoin(
      reverseEngraver,
      eq(reverseFaceEngraver.engraverId, reverseEngraver.id)
    )
    .leftJoin(parentIssuer, eq(issuer.parentIssuerId, parentIssuer.id))
    .leftJoin(coinMint, eq(coin.id, coinMint.coinId))
    .leftJoin(mint, eq(coinMint.mintId, mint.id))
    .leftJoin(coinTheme, eq(coin.id, coinTheme.coinId))
    .leftJoin(theme, eq(coinTheme.themeId, theme.id))
    .leftJoin(coinRuler, eq(coin.id, coinRuler.coinId))
    .leftJoin(ruler, eq(coinRuler.rulerId, ruler.id))
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .leftJoin(coinReference, eq(coin.id, coinReference.coinId))
    .leftJoin(catalogue, eq(coinReference.catalogueId, catalogue.id))
    .orderBy(
      desc(coin.createdAt),
      desc(coin.id),
      asc(obverseEngraver.name),
      asc(obverseEngraver.code),
      asc(obverseEngraver.id),
      asc(reverseEngraver.name),
      asc(reverseEngraver.code),
      asc(reverseEngraver.id),
      asc(mint.name),
      asc(mint.code),
      asc(mint.id),
      asc(theme.name),
      asc(theme.code),
      asc(theme.id),
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
