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
  row: GetCoinsReferenceColumns
): CoinCatalogueReference | null {
  const {
    referenceId,
    referenceType,
    referenceNumber,
    referenceCreatedAt,
    referenceUpdatedAt,
    referenceCatalogueId,
    referenceCatalogueCode,
    referenceCatalogueTitle,
    referenceCatalogueCreatedAt,
    referenceCatalogueUpdatedAt,
  } = row

  if (
    !referenceId ||
    referenceType !== "catalogue" ||
    !referenceNumber ||
    !referenceCreatedAt ||
    !referenceUpdatedAt ||
    !referenceCatalogueId ||
    !referenceCatalogueCode ||
    !referenceCatalogueTitle ||
    !referenceCatalogueCreatedAt ||
    !referenceCatalogueUpdatedAt
  ) {
    return null
  }

  return {
    id: referenceId,
    type: "catalogue",
    number: referenceNumber,
    createdAt: referenceCreatedAt,
    updatedAt: referenceUpdatedAt,
    catalogue: {
      id: referenceCatalogueId,
      code: referenceCatalogueCode,
      title: referenceCatalogueTitle,
      createdAt: referenceCatalogueCreatedAt,
      updatedAt: referenceCatalogueUpdatedAt,
    },
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

export function mapGetCoinsRowsToCoinRecords(
  rows: GetCoinsRow[]
): CoinRecord[] {
  const coinsById = new Map<string, CoinEntry>()

  for (const row of rows) {
    const existingEntry = coinsById.get(row.id)
    const coinEntry = existingEntry ?? {
      coin: mapCoinRecord(row),
      rulerAttributions: [],
      catalogueReferences: [],
    }

    if (!existingEntry) {
      coinsById.set(row.id, coinEntry)
    }

    const mappedRulerAttribution = mapRulerAttribution(row)

    if (mappedRulerAttribution) {
      const hasMatchingRuler = coinEntry.rulerAttributions.some(
        ({ order, ruler }) =>
          order === mappedRulerAttribution.order &&
          ruler.id === mappedRulerAttribution.ruler.id
      )

      if (!hasMatchingRuler) {
        coinEntry.rulerAttributions.push(mappedRulerAttribution)
      }
    }

    const mappedCatalogueReference = mapCatalogueReference(row)

    if (mappedCatalogueReference) {
      const hasMatchingReference = coinEntry.catalogueReferences.some(
        ({ id }) => id === mappedCatalogueReference.id
      )

      if (!hasMatchingReference) {
        coinEntry.catalogueReferences.push(mappedCatalogueReference)
      }
    }
  }

  return [...coinsById.values()].map(mapCoinEntry)
}
