export function normalizeCoinComments(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue === "" ? null : trimmedValue
}
