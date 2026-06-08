import type { CoinFaceValue } from "@workspace/db"

export function formatFaceValueLabel(
  faceValue: Pick<CoinFaceValue, "text">
): string {
  return `Face Value: ${faceValue.text}`
}
