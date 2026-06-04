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

type GetCoinsRulerBaseColumns = Pick<
  GetCoinsRow,
  "rulerId" | "rulerCode" | "rulerName" | "rulerCreatedAt" | "rulerUpdatedAt"
>

function mapRuler(
  row: GetCoinsRulerBaseColumns & GetCoinsRulerGroupColumns
): CoinRuler | null {
  const { rulerId, rulerCode, rulerName, rulerCreatedAt, rulerUpdatedAt } = row

  if (!rulerId || !rulerCode || !rulerName || !rulerCreatedAt || !rulerUpdatedAt) {
    return null
  }

  return {
    id: rulerId,
    code: rulerCode,
    name: rulerName,
    createdAt: rulerCreatedAt,
    updatedAt: rulerUpdatedAt,
    group: mapRulerGroup(row),
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
  const coinsById = new Map<string, CoinRecord>()

  for (const row of rows) {
    const existingCoin = coinsById.get(row.id)
    const coinRecord = existingCoin ?? mapCoinRecord(row)

    if (!existingCoin) {
      coinsById.set(row.id, coinRecord)
    }

    const mappedRuler = mapRuler(row)

    if (mappedRuler) {
      coinRecord.rulers.push(mappedRuler)
    }
  }

  return [...coinsById.values()]
}
