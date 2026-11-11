export function isIsoIssuerCode(code: string) {
  return /^[A-Z]{2}$/.test(code)
}
