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
} & GetCoinsIssuerColumns &
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

export type CoinIssuerParent = {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
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

type CoinEntry = {
  coin: CoinRecord
  rulerAttributions: CoinRulerAttribution[]
  catalogueReferences: CoinCatalogueReference[]
  seenRulerAttributionKeys: Set<string>
  seenCatalogueReferenceIds: Set<string>
}

type CoinRecordBase = Pick<
  GetCoinsRow,
  "id" | "title" | "createdAt" | "updatedAt"
>

export type CoinRecord = CoinRecordBase & {
  issuer: CoinIssuer
  rulers: CoinRuler[]
  references: CoinCatalogueReference[]
}

function mapParentIssuer({
  parentIssuerId,
  parentIssuerCode,
  parentIssuerName,
  parentIssuerCreatedAt,
  parentIssuerUpdatedAt,
}: GetCoinsParentIssuerColumns): CoinIssuerParent | null {
  if (
    !parentIssuerId ||
    !parentIssuerCode ||
    !parentIssuerName ||
    !parentIssuerCreatedAt ||
    !parentIssuerUpdatedAt
  ) {
    return null
  }

  return {
    id: parentIssuerId,
    code: parentIssuerCode,
    name: parentIssuerName,
    createdAt: parentIssuerCreatedAt,
    updatedAt: parentIssuerUpdatedAt,
  }
}

function mapRulerGroup({
  rulerGroupId,
  rulerGroupCode,
  rulerGroupName,
  rulerGroupCreatedAt,
  rulerGroupUpdatedAt,
}: GetCoinsRulerGroupColumns): CoinRulerGroup | null {
  if (
    !rulerGroupId ||
    !rulerGroupCode ||
    !rulerGroupName ||
    !rulerGroupCreatedAt ||
    !rulerGroupUpdatedAt
  ) {
    return null
  }

  return {
    id: rulerGroupId,
    code: rulerGroupCode,
    name: rulerGroupName,
    createdAt: rulerGroupCreatedAt,
    updatedAt: rulerGroupUpdatedAt,
  }
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

function mapCoinEntry({
  coin,
  rulerAttributions,
  catalogueReferences,
}: CoinEntry): CoinRecord {
  return {
    ...coin,
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

function mapCoinRecord(row: GetCoinsRow): CoinRecord {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    issuer: {
      id: row.issuerId,
      code: row.issuerCode,
      name: row.issuerName,
      createdAt: row.issuerCreatedAt,
      updatedAt: row.issuerUpdatedAt,
      parent: mapParentIssuer(row),
    },
    rulers: [],
    references: [],
  }
}

function createCoinEntry(row: GetCoinsRow): CoinEntry {
  return {
    coin: mapCoinRecord(row),
    rulerAttributions: [],
    catalogueReferences: [],
    seenRulerAttributionKeys: new Set<string>(),
    seenCatalogueReferenceIds: new Set<string>(),
  }
}

function getRulerAttributionKey({ order, ruler }: CoinRulerAttribution): string {
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

    addRulerAttribution(row, coinEntry)
    addCatalogueReference(row, coinEntry)
  }

  return [...coinsById.values()].map(mapCoinEntry)
}
