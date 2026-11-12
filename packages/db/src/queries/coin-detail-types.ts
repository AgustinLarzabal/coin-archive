import type {
  CoinRecord,
  CoinSurfaceRecord,
  CurrencyRecord,
  DenominationRecord,
  EngraverRecord,
  IssuerRecord,
  MintRecord,
  RulingAuthorityRecord,
  TagRecord,
} from "../schema/index.js"

export type Coin = Omit<
  CoinRecord,
  | "distributionId"
  | "compositionId"
  | "shapeId"
  | "techniqueId"
  | "orientationId"
> & {
  distribution: string
  distributionName: string
  composition: string | null
  compositionName: string | null
  shape: string | null
  shapeName: string | null
  technique: string | null
  techniqueName: string | null
  orientation: string | null
  issuer: IssuerRecord
  denomination: CoinDenomination | null
  rulingAuthorityAttributions: Array<CoinRulingAuthorityAttribution>
  mints: Array<MintRecord & { country: IssuerRecord }>
  tags: Array<Pick<TagRecord, "slug" | "name">>
  obverse: CoinSurfaceWithEngravers | null
  reverse: CoinSurfaceWithEngravers | null
  edge: CoinSurfaceRecord | null
}

export type CoinDenomination = DenominationRecord & {
  currency: CurrencyRecord
}

export type CoinRulingAuthorityAttribution = Pick<
  RulingAuthorityRecord,
  "slug" | "name"
> & {
  role: string
  tenure: string | null
}

export type CoinSurfaceWithEngravers = CoinSurfaceRecord & {
  engravers: Array<EngraverRecord>
}
