export function normalizeCoinComments(
  comments: string | null | undefined
): string | null {
  if (comments == null) {
    return null
  }

  const trimmedComments = comments.trim()

  return trimmedComments === "" ? null : trimmedComments
}
