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

export type GetCoinsRow = {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
} & GetCoinsIssuerColumns &
  GetCoinsRulerColumns

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

type CoinRulerAttribution = {
  order: number
  ruler: CoinRuler
}

type CoinEntry = {
  coin: CoinRecord
  rulerAttributions: CoinRulerAttribution[]
}

type CoinRecordBase = Pick<
  GetCoinsRow,
  "id" | "title" | "createdAt" | "updatedAt"
>

export type CoinRecord = CoinRecordBase & {
  issuer: CoinIssuer
  rulers: CoinRuler[]
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

function mapCoinEntry({ coin, rulerAttributions }: CoinEntry): CoinRecord {
  return {
    ...coin,
    rulers: rulerAttributions
      .sort(compareRulerAttributions)
      .map(({ ruler }) => ruler),
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
    }

    if (!existingEntry) {
      coinsById.set(row.id, coinEntry)
    }

    const mappedRulerAttribution = mapRulerAttribution(row)

    if (mappedRulerAttribution) {
      coinEntry.rulerAttributions.push(mappedRulerAttribution)
    }
  }

  return [...coinsById.values()].map(mapCoinEntry)
}
