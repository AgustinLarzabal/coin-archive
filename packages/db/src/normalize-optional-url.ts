export function normalizeOptionalUrl(
  url: string | null | undefined
): string | null {
  if (url == null) {
    return null
  }

  const trimmedUrl = url.trim()

  return trimmedUrl === "" ? null : trimmedUrl
}
