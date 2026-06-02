type GetCoinsIssuerColumns = {
  issuerCode: string;
  issuerName: string;
  parentIssuerCode: string | null;
  parentIssuerName: string | null;
};

type GetCoinsBaseColumns = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

type GetCoinsParentIssuerColumns = Pick<
  GetCoinsIssuerColumns,
  "parentIssuerCode" | "parentIssuerName"
>;

export type GetCoinsRow = GetCoinsBaseColumns & GetCoinsIssuerColumns;

export type CoinIssuerParent = {
  code: string;
  name: string;
};

export type CoinIssuer = {
  code: string;
  name: string;
  parent: CoinIssuerParent | null;
};

export type CoinRecord = Omit<GetCoinsRow, keyof GetCoinsIssuerColumns> & {
  issuer: CoinIssuer;
};

function getParentIssuer({
  parentIssuerCode,
  parentIssuerName,
}: GetCoinsParentIssuerColumns): CoinIssuerParent | null {
  if (!parentIssuerCode || !parentIssuerName) {
    return null;
  }

  return {
    code: parentIssuerCode,
    name: parentIssuerName,
  };
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
  };
}
