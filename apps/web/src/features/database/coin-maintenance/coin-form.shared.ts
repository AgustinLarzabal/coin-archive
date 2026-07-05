import type { CoinMaintenanceRecord } from "@workspace/db"

import type { CoinDraft } from "./actions"

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
    demonetizationStatus:
      coin.isDemonetized === null
        ? "unknown"
        : coin.isDemonetized
          ? "demonetized"
          : "not-demonetized",
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
