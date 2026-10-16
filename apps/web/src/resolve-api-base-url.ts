interface ApiBaseUrlOptions {
  production: boolean
}

export function resolveApiBaseUrl(
  value: string | undefined,
  options: ApiBaseUrlOptions
) {
  const configuredValue = value?.trim()

  if (!configuredValue) {
    if (options.production) {
      throw new Error(
        "Invalid web configuration: VITE_API_BASE_URL is required in production"
      )
    }

    return "http://localhost:3001"
  }

  const normalizedValue = configuredValue.replace(/\/$/, "")

  try {
    const url = new URL(normalizedValue)
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== normalizedValue
    ) {
      throw new Error("not an HTTP origin")
    }
  } catch {
    throw new Error(
      "Invalid web configuration: VITE_API_BASE_URL must be an HTTP or HTTPS origin without a path"
    )
  }

  return normalizedValue
}
