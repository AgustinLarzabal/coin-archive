type GetCoinsRowIssuerColumns = {
  issuerCode: string;
  issuerName: string;
  parentIssuerCode: string | null;
  parentIssuerName: string | null;
};

type BaseCoinRecord = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GetCoinsRow = BaseCoinRecord & GetCoinsRowIssuerColumns;

export type CoinIssuerParent = {
  code: string;
  name: string;
};

export type CoinIssuer = {
  code: string;
  name: string;
  parent: CoinIssuerParent | null;
};

export type CoinRecord = BaseCoinRecord & {
  issuer: CoinIssuer;
};

function getParentIssuer({
  parentIssuerCode,
  parentIssuerName,
}: Pick<GetCoinsRow, "parentIssuerCode" | "parentIssuerName">): CoinIssuerParent | null {
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
