type GetCoinsCompositionColumns = {
  compositionId: string
  compositionCode: string
  compositionName: string
  compositionDescription: string | null
  compositionCreatedAt: Date
  compositionUpdatedAt: Date
}

type GetCoinsDistributionColumns = {
  distributionId: string
  distributionCode: string
  distributionName: string
  distributionCreatedAt: Date
  distributionUpdatedAt: Date
}

type GetCoinsCurrencyColumns = {
  faceValueText: string
  faceValueNumericValue: number
  currencyId: string
  currencyCode: string
  currencyName: string
  currencyFullName: string
  currencyCreatedAt: Date
  currencyUpdatedAt: Date
}

type GetCoinsOrientationColumns = {
  orientationId?: string | null
  orientationCode?: string | null
  orientationName?: string | null
  orientationCreatedAt?: Date | null
  orientationUpdatedAt?: Date | null
}

type GetCoinsShapeColumns = {
  shapeId?: string | null
  shapeCode?: string | null
  shapeName?: string | null
  shapeCreatedAt?: Date | null
  shapeUpdatedAt?: Date | null
}

type GetCoinsRimColumns = {
  rimId?: string | null
  rimCode?: string | null
  rimName?: string | null
  rimCreatedAt?: Date | null
  rimUpdatedAt?: Date | null
}

type OptionalCoinCodeNamedColumns = {
  id?: string | null
  code?: string | null
  name?: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

type GetCoinsIssuerColumns = {
  issuerId: string
  issuerCode: string
  issuerName: string
  issuerCreatedAt: Date
  issuerUpdatedAt: Date
  parentIssuerId: string | null
  parentIssuerCode: string | null
  parentIssuerName: string | null
  parentIssuerCreatedAt: Date | null
  parentIssuerUpdatedAt: Date | null
}

type GetCoinsMintColumns = {
  mintId: string | null
  mintCode: string | null
  mintName: string | null
  mintCreatedAt: Date | null
  mintUpdatedAt: Date | null
}

type GetCoinsThemeColumns = {
  themeId?: string | null
  themeCode?: string | null
  themeName?: string | null
  themeCreatedAt?: Date | null
  themeUpdatedAt?: Date | null
}

type GetCoinsRulerColumns = {
  rulerOrder: number | null
  rulerId: string | null
  rulerCode: string | null
  rulerName: string | null
  rulerCreatedAt: Date | null
  rulerUpdatedAt: Date | null
  rulerGroupId: string | null
  rulerGroupCode: string | null
  rulerGroupName: string | null
  rulerGroupCreatedAt: Date | null
  rulerGroupUpdatedAt: Date | null
}

type GetCoinsReferenceColumns = {
  referenceId: string | null
  referenceType: "catalogue" | null
  referenceNumber: string | null
  referenceCreatedAt: Date | null
  referenceUpdatedAt: Date | null
  referenceCatalogueId: string | null
  referenceCatalogueCode: string | null
  referenceCatalogueTitle: string | null
  referenceCatalogueCreatedAt: Date | null
  referenceCatalogueUpdatedAt: Date | null
}

export type GetCoinsRow = {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  mintage: number | null
  minYear: number | null
  maxYear: number | null
  weight: number | null
  diameter: number | null
  thickness: number | null
} & GetCoinsCompositionColumns &
  GetCoinsCurrencyColumns &
  GetCoinsOrientationColumns &
  GetCoinsShapeColumns &
  GetCoinsRimColumns &
  GetCoinsDistributionColumns &
  GetCoinsIssuerColumns &
  GetCoinsMintColumns &
  GetCoinsThemeColumns &
  GetCoinsRulerColumns &
  GetCoinsReferenceColumns

type GetCoinsParentIssuerColumns = Pick<
  GetCoinsRow,
  | "parentIssuerId"
  | "parentIssuerCode"
  | "parentIssuerName"
  | "parentIssuerCreatedAt"
  | "parentIssuerUpdatedAt"
>

type GetCoinsRulerGroupColumns = Pick<
  GetCoinsRow,
  | "rulerGroupId"
  | "rulerGroupCode"
  | "rulerGroupName"
  | "rulerGroupCreatedAt"
  | "rulerGroupUpdatedAt"
>

type GetCoinsCatalogueColumns = Pick<
  GetCoinsRow,
  | "referenceCatalogueId"
  | "referenceCatalogueCode"
  | "referenceCatalogueTitle"
  | "referenceCatalogueCreatedAt"
  | "referenceCatalogueUpdatedAt"
>

type GetCoinsCurrencyRecordColumns = Pick<
  GetCoinsCurrencyColumns,
  | "currencyId"
  | "currencyCode"
  | "currencyName"
  | "currencyFullName"
  | "currencyCreatedAt"
  | "currencyUpdatedAt"
>

export type CoinIssuerParent = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CoinDistribution = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CoinComposition = {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export type CoinIssueYearRange = {
  minYear: number
  maxYear: number
}

export type CoinCurrency = {
  id: string
  code: string
  name: string
  fullName: string
  createdAt: Date
  updatedAt: Date
}

export type CoinFaceValue = {
  text: string
  numericValue: number
  currency: CoinCurrency
}

export type CoinOrientation = CoinCodeNamedRecord
export type CoinShape = CoinCodeNamedRecord
export type CoinRim = CoinCodeNamedRecord

export type CoinMeasurements = {
  weight: number | null
  diameter: number | null
  thickness: number | null
}

export type CoinIssuer = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
  parent: CoinIssuerParent | null
}

export type CoinRulerGroup = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CoinRuler = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
  group: CoinRulerGroup | null
}

export type CoinCatalogue = {
  id: string
  code: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export type CoinCatalogueReference = {
  id: string
  type: "catalogue"
  catalogue: CoinCatalogue
  number: string
  createdAt: Date
  updatedAt: Date
}

type CoinRulerAttribution = {
  order: number
  ruler: CoinRuler
}

type CoinCodeNamedRecord = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CoinRecordMint = CoinCodeNamedRecord

export type CoinThemeRecord = CoinCodeNamedRecord

type CoinEntry = {
  coin: CoinEntryCoin
  mints: CoinRecordMint[]
  themes: CoinThemeRecord[]
  rulerAttributions: CoinRulerAttribution[]
  catalogueReferences: CoinCatalogueReference[]
  seenMintIds: Set<string>
  seenThemeIds: Set<string>
  seenRulerAttributionKeys: Set<string>
  seenCatalogueReferenceIds: Set<string>
}

type CoinRecordBase = Pick<
  GetCoinsRow,
  "id" | "title" | "createdAt" | "updatedAt" | "mintage"
>

export type CoinRecord = CoinRecordBase & {
  issueYearRange: CoinIssueYearRange | null
  faceValue: CoinFaceValue
  orientation: CoinOrientation | null
  shape: CoinShape | null
  rim: CoinRim | null
  measurements: CoinMeasurements
  composition: CoinComposition
  distribution: CoinDistribution
  issuer: CoinIssuer
  mints: CoinRecordMint[]
  themes: CoinThemeRecord[]
  rulers: CoinRuler[]
  references: CoinCatalogueReference[]
}

type CoinEntryCoin = Omit<
  CoinRecord,
  "mints" | "themes" | "rulers" | "references"
>

function mapIssueYearRange({
  minYear,
  maxYear,
}: Pick<GetCoinsRow, "minYear" | "maxYear">): CoinIssueYearRange | null {
  if (minYear === null || maxYear === null) {
    return null
  }

  return {
    minYear,
    maxYear,
  }
}

function mapMeasurements({
  weight,
  diameter,
  thickness,
}: Pick<GetCoinsRow, "weight" | "diameter" | "thickness">): CoinMeasurements {
  return {
    weight,
    diameter,
    thickness,
  }
}

function mapOrientation({
  orientationId: id,
  orientationCode: code,
  orientationName: name,
  orientationCreatedAt: createdAt,
  orientationUpdatedAt: updatedAt,
}: GetCoinsOrientationColumns): CoinOrientation | null {
  return mapOptionalCodeNamedRecord({ id, code, name, createdAt, updatedAt })
}

function mapShape({
  shapeId: id,
  shapeCode: code,
  shapeName: name,
  shapeCreatedAt: createdAt,
  shapeUpdatedAt: updatedAt,
}: GetCoinsShapeColumns): CoinShape | null {
  return mapOptionalCodeNamedRecord({ id, code, name, createdAt, updatedAt })
}

function mapRim({
  rimId: id,
  rimCode: code,
  rimName: name,
  rimCreatedAt: createdAt,
  rimUpdatedAt: updatedAt,
}: GetCoinsRimColumns): CoinRim | null {
  return mapOptionalCodeNamedRecord({ id, code, name, createdAt, updatedAt })
}

function mapCurrency({
  currencyId,
  currencyCode,
  currencyName,
  currencyFullName,
  currencyCreatedAt,
  currencyUpdatedAt,
}: GetCoinsCurrencyRecordColumns): CoinCurrency {
  return {
    id: currencyId,
    code: currencyCode,
    name: currencyName,
    fullName: currencyFullName,
    createdAt: currencyCreatedAt,
    updatedAt: currencyUpdatedAt,
  }
}

function mapFaceValue({
  faceValueText,
  faceValueNumericValue,
  ...currencyColumns
}: GetCoinsCurrencyColumns): CoinFaceValue {
  return {
    text: faceValueText,
    numericValue: faceValueNumericValue,
    currency: mapCurrency(currencyColumns),
  }
}

function mapDistribution({
  distributionId,
  distributionCode,
  distributionName,
  distributionCreatedAt,
  distributionUpdatedAt,
}: GetCoinsDistributionColumns): CoinDistribution {
  return mapCodeNamedRecord({
    id: distributionId,
    code: distributionCode,
    name: distributionName,
    createdAt: distributionCreatedAt,
    updatedAt: distributionUpdatedAt,
  })
}

function mapCodeNamedRecord({
  id,
  code,
  name,
  createdAt,
  updatedAt,
}: CoinCodeNamedRecord): CoinCodeNamedRecord {
  return {
    id,
    code,
    name,
    createdAt,
    updatedAt,
  }
}

function mapOptionalCodeNamedRecord({
  id,
  code,
  name,
  createdAt,
  updatedAt,
}: OptionalCoinCodeNamedColumns): CoinCodeNamedRecord | null {
  if (!id || !code || !name || !createdAt || !updatedAt) {
    return null
  }

  return mapCodeNamedRecord({
    id,
    code,
    name,
    createdAt,
    updatedAt,
  })
}

function mapComposition({
  compositionId,
  compositionCode,
  compositionName,
  compositionDescription,
  compositionCreatedAt,
  compositionUpdatedAt,
}: GetCoinsCompositionColumns): CoinComposition {
  return {
    ...mapCodeNamedRecord({
      id: compositionId,
      code: compositionCode,
      name: compositionName,
      createdAt: compositionCreatedAt,
      updatedAt: compositionUpdatedAt,
    }),
    description: compositionDescription,
  }
}

function mapParentIssuer({
  parentIssuerId,
  parentIssuerCode,
  parentIssuerName,
  parentIssuerCreatedAt,
  parentIssuerUpdatedAt,
}: GetCoinsParentIssuerColumns): CoinIssuerParent | null {
  return mapOptionalCodeNamedRecord({
    id: parentIssuerId,
    code: parentIssuerCode,
    name: parentIssuerName,
    createdAt: parentIssuerCreatedAt,
    updatedAt: parentIssuerUpdatedAt,
  })
}

function mapIssuer({
  issuerId,
  issuerCode,
  issuerName,
  issuerCreatedAt,
  issuerUpdatedAt,
  ...row
}: GetCoinsIssuerColumns): CoinIssuer {
  return {
    id: issuerId,
    code: issuerCode,
    name: issuerName,
    createdAt: issuerCreatedAt,
    updatedAt: issuerUpdatedAt,
    parent: mapParentIssuer(row),
  }
}

function mapMint(row: GetCoinsMintColumns): CoinRecordMint | null {
  return mapOptionalCodeNamedRecord({
    id: row.mintId,
    code: row.mintCode,
    name: row.mintName,
    createdAt: row.mintCreatedAt,
    updatedAt: row.mintUpdatedAt,
  })
}

function mapTheme(row: GetCoinsThemeColumns): CoinThemeRecord | null {
  return mapOptionalCodeNamedRecord({
    id: row.themeId ?? null,
    code: row.themeCode ?? null,
    name: row.themeName ?? null,
    createdAt: row.themeCreatedAt ?? null,
    updatedAt: row.themeUpdatedAt ?? null,
  })
}

function mapRulerGroup({
  rulerGroupId,
  rulerGroupCode,
  rulerGroupName,
  rulerGroupCreatedAt,
  rulerGroupUpdatedAt,
}: GetCoinsRulerGroupColumns): CoinRulerGroup | null {
  return mapOptionalCodeNamedRecord({
    id: rulerGroupId,
    code: rulerGroupCode,
    name: rulerGroupName,
    createdAt: rulerGroupCreatedAt,
    updatedAt: rulerGroupUpdatedAt,
  })
}

function mapCatalogue({
  referenceCatalogueId,
  referenceCatalogueCode,
  referenceCatalogueTitle,
  referenceCatalogueCreatedAt,
  referenceCatalogueUpdatedAt,
}: GetCoinsCatalogueColumns): CoinCatalogue | null {
  if (
    !referenceCatalogueId ||
    !referenceCatalogueCode ||
    !referenceCatalogueTitle ||
    !referenceCatalogueCreatedAt ||
    !referenceCatalogueUpdatedAt
  ) {
    return null
  }

  return {
    id: referenceCatalogueId,
    code: referenceCatalogueCode,
    title: referenceCatalogueTitle,
    createdAt: referenceCatalogueCreatedAt,
    updatedAt: referenceCatalogueUpdatedAt,
  }
}

type GetCoinsRulerAttributionColumns = Pick<
  GetCoinsRow,
  | "rulerOrder"
  | "rulerId"
  | "rulerCode"
  | "rulerName"
  | "rulerCreatedAt"
  | "rulerUpdatedAt"
>

function mapRulerAttribution(
  row: GetCoinsRulerAttributionColumns & GetCoinsRulerGroupColumns
): CoinRulerAttribution | null {
  const {
    rulerOrder,
    rulerId,
    rulerCode,
    rulerName,
    rulerCreatedAt,
    rulerUpdatedAt,
  } = row

  if (
    rulerOrder === null ||
    !rulerId ||
    !rulerCode ||
    !rulerName ||
    !rulerCreatedAt ||
    !rulerUpdatedAt
  ) {
    return null
  }

  return {
    order: rulerOrder,
    ruler: {
      id: rulerId,
      code: rulerCode,
      name: rulerName,
      createdAt: rulerCreatedAt,
      updatedAt: rulerUpdatedAt,
      group: mapRulerGroup(row),
    },
  }
}

function compareRulerAttributions(
  left: CoinRulerAttribution,
  right: CoinRulerAttribution
): number {
  return left.order - right.order || left.ruler.id.localeCompare(right.ruler.id)
}

function compareCatalogueReferences(
  left: CoinCatalogueReference,
  right: CoinCatalogueReference
): number {
  return (
    left.catalogue.title.localeCompare(right.catalogue.title) ||
    left.number.localeCompare(right.number) ||
    left.id.localeCompare(right.id)
  )
}

function compareMints(left: CoinRecordMint, right: CoinRecordMint): number {
  return compareCodeNamedRecords(left, right)
}

function compareThemes(left: CoinThemeRecord, right: CoinThemeRecord): number {
  return compareCodeNamedRecords(left, right)
}

function compareCodeNamedRecords(
  left: CoinCodeNamedRecord,
  right: CoinCodeNamedRecord
): number {
  return (
    left.name.localeCompare(right.name) ||
    left.code.localeCompare(right.code) ||
    left.id.localeCompare(right.id)
  )
}

function mapCoinEntry({
  coin,
  mints,
  themes,
  rulerAttributions,
  catalogueReferences,
}: CoinEntry): CoinRecord {
  return {
    ...coin,
    mints: mints.sort(compareMints),
    themes: themes.sort(compareThemes),
    rulers: rulerAttributions
      .sort(compareRulerAttributions)
      .map(({ ruler }) => ruler),
    references: catalogueReferences.sort(compareCatalogueReferences),
  }
}

function mapCatalogueReference(
  row: GetCoinsReferenceColumns & GetCoinsCatalogueColumns
): CoinCatalogueReference | null {
  const {
    referenceId,
    referenceType,
    referenceNumber,
    referenceCreatedAt,
    referenceUpdatedAt,
  } = row
  const mappedCatalogue = mapCatalogue(row)

  if (
    !referenceId ||
    referenceType !== "catalogue" ||
    !referenceNumber ||
    !referenceCreatedAt ||
    !referenceUpdatedAt ||
    !mappedCatalogue
  ) {
    return null
  }

  return {
    id: referenceId,
    type: "catalogue",
    number: referenceNumber,
    createdAt: referenceCreatedAt,
    updatedAt: referenceUpdatedAt,
    catalogue: mappedCatalogue,
  }
}

function mapCoinRecord(row: GetCoinsRow): CoinEntryCoin {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    mintage: row.mintage,
    issueYearRange: mapIssueYearRange(row),
    faceValue: mapFaceValue(row),
    orientation: mapOrientation(row),
    shape: mapShape(row),
    rim: mapRim(row),
    measurements: mapMeasurements(row),
    composition: mapComposition(row),
    distribution: mapDistribution(row),
    issuer: mapIssuer(row),
  }
}

function createCoinEntry(row: GetCoinsRow): CoinEntry {
  return {
    coin: mapCoinRecord(row),
    mints: [],
    themes: [],
    rulerAttributions: [],
    catalogueReferences: [],
    seenMintIds: new Set<string>(),
    seenThemeIds: new Set<string>(),
    seenRulerAttributionKeys: new Set<string>(),
    seenCatalogueReferenceIds: new Set<string>(),
  }
}

function addMint(row: GetCoinsRow, coinEntry: CoinEntry) {
  const mappedMint = mapMint(row)

  if (!mappedMint || coinEntry.seenMintIds.has(mappedMint.id)) {
    return
  }

  coinEntry.seenMintIds.add(mappedMint.id)
  coinEntry.mints.push(mappedMint)
}

function addTheme(row: GetCoinsRow, coinEntry: CoinEntry) {
  const mappedTheme = mapTheme(row)

  if (!mappedTheme || coinEntry.seenThemeIds.has(mappedTheme.id)) {
    return
  }

  coinEntry.seenThemeIds.add(mappedTheme.id)
  coinEntry.themes.push(mappedTheme)
}

function getRulerAttributionKey({
  order,
  ruler,
}: CoinRulerAttribution): string {
  return `${order}:${ruler.id}`
}

function addRulerAttribution(row: GetCoinsRow, coinEntry: CoinEntry) {
  const mappedRulerAttribution = mapRulerAttribution(row)

  if (!mappedRulerAttribution) {
    return
  }

  const rulerAttributionKey = getRulerAttributionKey(mappedRulerAttribution)

  if (coinEntry.seenRulerAttributionKeys.has(rulerAttributionKey)) {
    return
  }

  coinEntry.seenRulerAttributionKeys.add(rulerAttributionKey)
  coinEntry.rulerAttributions.push(mappedRulerAttribution)
}

function addCatalogueReference(row: GetCoinsRow, coinEntry: CoinEntry) {
  const mappedCatalogueReference = mapCatalogueReference(row)

  if (!mappedCatalogueReference) {
    return
  }

  if (coinEntry.seenCatalogueReferenceIds.has(mappedCatalogueReference.id)) {
    return
  }

  coinEntry.seenCatalogueReferenceIds.add(mappedCatalogueReference.id)
  coinEntry.catalogueReferences.push(mappedCatalogueReference)
}

export function mapGetCoinsRowsToCoinRecords(
  rows: GetCoinsRow[]
): CoinRecord[] {
  const coinsById = new Map<string, CoinEntry>()

  for (const row of rows) {
    let coinEntry = coinsById.get(row.id)

    if (!coinEntry) {
      coinEntry = createCoinEntry(row)
      coinsById.set(row.id, coinEntry)
    }

    addMint(row, coinEntry)
    addTheme(row, coinEntry)
    addRulerAttribution(row, coinEntry)
    addCatalogueReference(row, coinEntry)
  }

  return [...coinsById.values()].map(mapCoinEntry)
}
