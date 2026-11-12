import type { CoinDenomination } from "./coin-detail-types.js"
import type { CoinRecord, IssuerRecord } from "../schema/index.js"

export type CoinListItem = Omit<
  CoinRecord,
  | "denominationId"
  | "distributionId"
  | "compositionId"
  | "compositionDetail"
  | "demonetized"
  | "size"
  | "thickness"
  | "weight"
  | "shapeId"
  | "techniqueId"
  | "orientationId"
> & {
  distribution: string
  issuer: IssuerRecord
  denomination: CoinDenomination | null
  obverseImageKey: string | null
  reverseImageKey: string | null
}

export interface CoinListOptions {
  sizeInterval?: { min: string; max: string }
  thicknessInterval?: { min: string; max: string }
  weightInterval?: { min: string; max: string }
  currencySlug?: string
  faceValueAmount?: string
  distribution?: string
  technique?: string
  tagSlug?: string
  composition?: string
  shape?: string
  orientation?: string
  engraverSlug?: string
  issueYearInterval?: IssueYearInterval
  issuerCode?: string
  mintSlug?: string
  page?: number
  pageSize?: number
  rulingAuthoritySlug?: string
}

export interface IssueYearInterval {
  firstIssueYear: number
  lastIssueYear: number
}

export interface CoinListPage {
  coins: Array<CoinListItem>
  totalItems: number
}
