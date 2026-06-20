export const RULER_FILTER_LABEL = "Ruling authority"

export function getIssuerRulerFilterDescription(
  issuerName: string,
  rulerName: string
) {
  return `issuer ${issuerName} and ${RULER_FILTER_LABEL.toLowerCase()} ${rulerName}`
}
