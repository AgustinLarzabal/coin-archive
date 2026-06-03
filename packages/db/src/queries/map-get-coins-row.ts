type GetCoinsIssuerColumns = {
  issuerCode: string
  issuerName: string
  parentIssuerCode: string | null
  parentIssuerName: string | null
}

export type GetCoinsRow = {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
} & GetCoinsIssuerColumns

type GetCoinsParentIssuerColumns = Pick<
  GetCoinsRow,
  "parentIssuerCode" | "parentIssuerName"
>

export type CoinIssuerParent = {
  code: string
  name: string
}

export type CoinIssuer = {
  code: string
  name: string
  parent: CoinIssuerParent | null
}

type CoinRecordBase = Omit<GetCoinsRow, keyof GetCoinsIssuerColumns>

export type CoinRecord = CoinRecordBase & {
  issuer: CoinIssuer
}

function getParentIssuer({
  parentIssuerCode,
  parentIssuerName,
}: GetCoinsParentIssuerColumns): CoinIssuerParent | null {
  if (!parentIssuerCode || !parentIssuerName) {
    return null
  }

  return {
    code: parentIssuerCode,
    name: parentIssuerName,
  }
}

export function mapGetCoinsRowToCoinRecord({
  issuerCode,
  issuerName,
  parentIssuerCode,
  parentIssuerName,
  ...coinRecord
}: GetCoinsRow): CoinRecord {
  return {
    ...coinRecord,
    issuer: {
      code: issuerCode,
      name: issuerName,
      parent: getParentIssuer({ parentIssuerCode, parentIssuerName }),
    },
  }
}
