import { normalizeCoinComments } from "../normalize-coin-comments"

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

type GetCoinsEdgeColumns = {
  edgeId?: string | null
  edgeCode?: string | null
  edgeName?: string | null
  edgeDescription?: string | null
  edgeLettering?: string | null
  edgeCreatedAt?: Date | null
  edgeUpdatedAt?: Date | null
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

type GetCoinsFaceColumns = {
  obverseDescription?: string | null
  obverseLettering?: string | null
  obverseEngraverId?: string | null
  obverseEngraverCode?: string | null
  obverseEngraverName?: string | null
  obverseEngraverCreatedAt?: Date | null
  obverseEngraverUpdatedAt?: Date | null
  reverseDescription?: string | null
  reverseLettering?: string | null
  reverseEngraverId?: string | null
  reverseEngraverCode?: string | null
  reverseEngraverName?: string | null
  reverseEngraverCreatedAt?: Date | null
  reverseEngraverUpdatedAt?: Date | null
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
  comments: string | null
  isDemonetized: boolean | null
  mintage: number | null
  minYear: number | null
  maxYear: number | null
  weight: number | null
  diameter: number | null
  thickness: number | null
} & GetCoinsCompositionColumns &
  GetCoinsCurrencyColumns &
  GetCoinsFaceColumns &
  GetCoinsDistributionColumns &
  GetCoinsEdgeColumns &
  GetCoinsIssuerColumns &
  GetCoinsMintColumns &
  GetCoinsOrientationColumns &
  GetCoinsReferenceColumns &
  GetCoinsRimColumns &
  GetCoinsRulerColumns &
  GetCoinsShapeColumns &
  GetCoinsThemeColumns

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

export type CoinCodeNamedRecord = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CoinIssuerParent = CoinCodeNamedRecord
export type CoinDistribution = CoinCodeNamedRecord
export type CoinOrientation = CoinCodeNamedRecord
export type CoinShape = CoinCodeNamedRecord
export type CoinRim = CoinCodeNamedRecord
export type CoinRecordMint = CoinCodeNamedRecord
export type CoinThemeRecord = CoinCodeNamedRecord

export type CoinComposition = CoinCodeNamedRecord & {
  description: string | null
}

export type CoinIssueYearRange = {
  minYear: number
  maxYear: number
}

export type CoinCurrency = CoinCodeNamedRecord & {
  fullName: string
}

export type CoinFaceValue = {
  text: string
  numericValue: number
  currency: CoinCurrency
}

export type CoinFaceDetails = {
  description: string | null
  lettering: string | null
  engravers: CoinEngraver[]
}

export type CoinEdge = {
  id: string | null
  code: string | null
  name: string | null
  description: string | null
  lettering: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type CoinMeasurements = {
  weight: number | null
  diameter: number | null
  thickness: number | null
}

export type CoinIssuer = CoinCodeNamedRecord & {
  parent: CoinIssuerParent | null
}

export type CoinRulerGroup = CoinCodeNamedRecord

export type CoinRuler = CoinCodeNamedRecord & {
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

type CoinRecordBase = Pick<
  GetCoinsRow,
  | "id"
  | "title"
  | "createdAt"
  | "updatedAt"
  | "comments"
  | "isDemonetized"
  | "mintage"
>

export type CoinRecord = CoinRecordBase & {
  composition: CoinComposition
  distribution: CoinDistribution
  edge: CoinEdge | null
  faceValue: CoinFaceValue
  issueYearRange: CoinIssueYearRange | null
  issuer: CoinIssuer
  measurements: CoinMeasurements
  mints: CoinRecordMint[]
  obverse: CoinFaceDetails | null
  orientation: CoinOrientation | null
  references: CoinCatalogueReference[]
  reverse: CoinFaceDetails | null
  rim: CoinRim | null
  rulers: CoinRuler[]
  shape: CoinShape | null
  themes: CoinThemeRecord[]
}

export type CoinEngraver = CoinCodeNamedRecord
type CoinEntryCoin = Omit<
  CoinRecord,
  "mints" | "references" | "rulers" | "themes"
>

type CoinFaceSide = "obverse" | "reverse"

type CoinEntry = {
  coin: CoinEntryCoin
  mints: CoinRecordMint[]
  themes: CoinThemeRecord[]
  rulerAttributions: CoinRulerAttribution[]
  catalogueReferences: CoinCatalogueReference[]
  seenObverseEngraverIds: Set<string>
  seenReverseEngraverIds: Set<string>
  seenMintIds: Set<string>
  seenThemeIds: Set<string>
  seenRulerAttributionKeys: Set<string>
  seenCatalogueReferenceIds: Set<string>
}

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

function mapOrientation({
  orientationId: id,
  orientationCode: code,
  orientationName: name,
  orientationCreatedAt: createdAt,
  orientationUpdatedAt: updatedAt,
}: GetCoinsOrientationColumns): CoinOrientation | null {
  return mapOptionalCodeNamedRecord({ id, code, name, createdAt, updatedAt })
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  return value.trim() === "" ? null : value
}

function mapEdge({
  edgeId,
  edgeCode,
  edgeName,
  edgeDescription,
  edgeLettering,
  edgeCreatedAt,
  edgeUpdatedAt,
}: GetCoinsEdgeColumns): CoinEdge | null {
  const description = normalizeOptionalText(edgeDescription)
  const lettering = normalizeOptionalText(edgeLettering)
  const hasLookup =
    !!edgeId && !!edgeCode && !!edgeName && !!edgeCreatedAt && !!edgeUpdatedAt

  if (!hasLookup && description === null && lettering === null) {
    return null
  }

  return {
    id: hasLookup ? edgeId! : null,
    code: hasLookup ? edgeCode! : null,
    name: hasLookup ? edgeName! : null,
    description,
    lettering,
    createdAt: hasLookup ? edgeCreatedAt! : null,
    updatedAt: hasLookup ? edgeUpdatedAt! : null,
  }
}

function mapCoinFaceDetails({
  description,
  lettering,
  engravers,
}: {
  description?: string | null
  lettering?: string | null
  engravers: CoinEngraver[]
}): CoinFaceDetails | null {
  const normalizedDescription = normalizeOptionalText(description)
  const normalizedLettering = normalizeOptionalText(lettering)

  if (
    normalizedDescription === null &&
    normalizedLettering === null &&
    engravers.length === 0
  ) {
    return null
  }

  return {
    description: normalizedDescription,
    lettering: normalizedLettering,
    engravers,
  }
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
    ...mapCodeNamedRecord({
      id: currencyId,
      code: currencyCode,
      name: currencyName,
      createdAt: currencyCreatedAt,
      updatedAt: currencyUpdatedAt,
    }),
    fullName: currencyFullName,
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

function mapObverseEngraver(row: GetCoinsFaceColumns): CoinEngraver | null {
  return mapOptionalCodeNamedRecord({
    id: row.obverseEngraverId ?? null,
    code: row.obverseEngraverCode ?? null,
    name: row.obverseEngraverName ?? null,
    createdAt: row.obverseEngraverCreatedAt ?? null,
    updatedAt: row.obverseEngraverUpdatedAt ?? null,
  })
}

function mapReverseEngraver(row: GetCoinsFaceColumns): CoinEngraver | null {
  return mapOptionalCodeNamedRecord({
    id: row.reverseEngraverId ?? null,
    code: row.reverseEngraverCode ?? null,
    name: row.reverseEngraverName ?? null,
    createdAt: row.reverseEngraverCreatedAt ?? null,
    updatedAt: row.reverseEngraverUpdatedAt ?? null,
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

function compareEngravers(left: CoinEngraver, right: CoinEngraver): number {
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

function sortFaceEngravers(
  face: CoinFaceDetails | null
): CoinFaceDetails | null {
  if (face === null) {
    return null
  }

  return {
    ...face,
    engravers: face.engravers.sort(compareEngravers),
  }
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
    obverse: sortFaceEngravers(coin.obverse),
    reverse: sortFaceEngravers(coin.reverse),
    mints: mints.sort(compareCodeNamedRecords),
    themes: themes.sort(compareCodeNamedRecords),
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
    comments: normalizeCoinComments(row.comments),
    isDemonetized: row.isDemonetized,
    mintage: row.mintage,
    issueYearRange: mapIssueYearRange(row),
    faceValue: mapFaceValue(row),
    obverse: mapCoinFaceDetails({
      description: row.obverseDescription,
      lettering: row.obverseLettering,
      engravers: [],
    }),
    reverse: mapCoinFaceDetails({
      description: row.reverseDescription,
      lettering: row.reverseLettering,
      engravers: [],
    }),
    orientation: mapOrientation(row),
    edge: mapEdge(row),
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
    seenObverseEngraverIds: new Set<string>(),
    seenReverseEngraverIds: new Set<string>(),
    seenMintIds: new Set<string>(),
    seenThemeIds: new Set<string>(),
    seenRulerAttributionKeys: new Set<string>(),
    seenCatalogueReferenceIds: new Set<string>(),
  }
}

function getCoinFaceTextColumns(
  row: GetCoinsRow,
  side: CoinFaceSide
): Pick<CoinFaceDetails, "description" | "lettering"> {
  if (side === "obverse") {
    return {
      description: row.obverseDescription ?? null,
      lettering: row.obverseLettering ?? null,
    }
  }

  return {
    description: row.reverseDescription ?? null,
    lettering: row.reverseLettering ?? null,
  }
}

function mapFaceEngraver(
  row: GetCoinsRow,
  side: CoinFaceSide
): CoinEngraver | null {
  if (side === "obverse") {
    return mapObverseEngraver(row)
  }

  return mapReverseEngraver(row)
}

function getSeenFaceEngraverIds(
  coinEntry: CoinEntry,
  side: CoinFaceSide
): Set<string> {
  if (side === "obverse") {
    return coinEntry.seenObverseEngraverIds
  }

  return coinEntry.seenReverseEngraverIds
}

function ensureCoinFaceDetails(
  row: GetCoinsRow,
  coinEntry: CoinEntry,
  side: CoinFaceSide
) {
  const existingFace = coinEntry.coin[side]

  if (existingFace !== null) {
    return existingFace
  }

  const mappedFace = mapCoinFaceDetails({
    ...getCoinFaceTextColumns(row, side),
    engravers: [],
  })

  if (mappedFace === null) {
    coinEntry.coin[side] = {
      description: null,
      lettering: null,
      engravers: [],
    }

    return coinEntry.coin[side]!
  }

  coinEntry.coin[side] = mappedFace

  return mappedFace
}

function addFaceEngraver(
  row: GetCoinsRow,
  coinEntry: CoinEntry,
  side: CoinFaceSide
) {
  const mappedEngraver = mapFaceEngraver(row, side)
  const seenEngraverIds = getSeenFaceEngraverIds(coinEntry, side)

  if (!mappedEngraver || seenEngraverIds.has(mappedEngraver.id)) {
    return
  }

  seenEngraverIds.add(mappedEngraver.id)
  ensureCoinFaceDetails(row, coinEntry, side).engravers.push(mappedEngraver)
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
    addFaceEngraver(row, coinEntry, "obverse")
    addFaceEngraver(row, coinEntry, "reverse")
  }

  return [...coinsById.values()].map(mapCoinEntry)
}
