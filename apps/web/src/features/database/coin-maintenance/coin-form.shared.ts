import type {
  CoinMaintenanceRecord,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  EdgeOption,
  IssuerOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
} from "@workspace/db"

import type { CoinDraft } from "./actions"

export type CoinFormOptions = {
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  distributions: DistributionOption[]
  edges: EdgeOption[]
  issuers: IssuerOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  shapes: ShapeOption[]
  techniques: TechniqueOption[]
}

const REQUIRED_LOOKUP_OPTION_KEYS = [
  "issuers",
  "rulers",
  "distributions",
  "compositions",
  "currencies",
] as const

export const EMPTY_COIN_DRAFT: CoinDraft = {
  title: "",
  issuerId: "",
  rulerId: "",
  distributionId: "",
  compositionId: "",
  faceValueText: "",
  faceValueNumericValue: "",
  currencyId: "",
  orientationId: "",
  shapeId: "",
  techniqueId: "",
  edgeId: "",
  rimId: "",
  weight: "",
  diameter: "",
  thickness: "",
  mintage: "",
  comments: "",
  minYear: "",
  maxYear: "",
  demonetizationStatus: "unknown",
}

function stringifyOptionalNumber(value: number | null) {
  return value === null ? "" : String(value)
}

function getDemonetizationStatus(
  isDemonetized: boolean | null
): CoinDraft["demonetizationStatus"] {
  if (isDemonetized === null) {
    return "unknown"
  }

  if (isDemonetized) {
    return "demonetized"
  }

  return "not-demonetized"
}

export function getNextEditSuccessMessage({
  currentSuccessMessage,
  nextCoinId,
  previousCoinId,
}: NextEditSuccessMessageInput): string | null {
  return previousCoinId === nextCoinId ? currentSuccessMessage : null
}

type NextEditSuccessMessageInput = {
  currentSuccessMessage: string | null
  nextCoinId: string
  previousCoinId: string | null
}

export function createCoinDraft(coin: CoinMaintenanceRecord): CoinDraft {
  return {
    title: coin.title,
    issuerId: coin.issuerId,
    rulerId: coin.rulerId ?? "",
    distributionId: coin.distributionId,
    compositionId: coin.compositionId,
    faceValueText: coin.faceValueText,
    faceValueNumericValue: String(coin.faceValueNumericValue),
    currencyId: coin.currencyId,
    orientationId: coin.orientationId ?? "",
    shapeId: coin.shapeId ?? "",
    techniqueId: coin.techniqueId ?? "",
    edgeId: coin.edgeId ?? "",
    rimId: coin.rimId ?? "",
    weight: stringifyOptionalNumber(coin.weight),
    diameter: stringifyOptionalNumber(coin.diameter),
    thickness: stringifyOptionalNumber(coin.thickness),
    mintage: stringifyOptionalNumber(coin.mintage),
    comments: coin.comments ?? "",
    minYear: stringifyOptionalNumber(coin.minYear),
    maxYear: stringifyOptionalNumber(coin.maxYear),
    demonetizationStatus: getDemonetizationStatus(coin.isDemonetized),
  }
}

function normalizeDraftValue(value: string) {
  return value.trim()
}

export function hasRequiredCoinDraftFields(draft: CoinDraft) {
  return (
    normalizeDraftValue(draft.title) !== "" &&
    normalizeDraftValue(draft.issuerId) !== "" &&
    normalizeDraftValue(draft.rulerId) !== "" &&
    normalizeDraftValue(draft.distributionId) !== "" &&
    normalizeDraftValue(draft.compositionId) !== "" &&
    normalizeDraftValue(draft.faceValueText) !== "" &&
    normalizeDraftValue(String(draft.faceValueNumericValue)) !== "" &&
    normalizeDraftValue(draft.currencyId) !== ""
  )
}

export function hasRequiredCoinLookupOptions(options: CoinFormOptions) {
  return REQUIRED_LOOKUP_OPTION_KEYS.every((key) => options[key].length > 0)
}
