import { createPublicApiClient } from "@coin-archive/api"

type Environment = Record<string, string | undefined>

const API_REFERENCE_PATH = "/api/v1/reference"

export function getPublicApiBaseUrl(environment: Environment = process.env) {
  const explicitBaseUrl = environment.PUBLIC_API_BASE_URL?.trim()

  if (explicitBaseUrl) {
    return explicitBaseUrl
  }

  return environment.CLOUDFLARE_ENV === "production"
    ? "https://api.coinarchive.app"
    : environment.CLOUDFLARE_ENV === "staging"
      ? "https://api.staging.coinarchive.app"
      : "http://127.0.0.1:8787"
}

export function getApiReferenceUrl(environment: Environment = process.env) {
  return `${getPublicApiBaseUrl(environment)}${API_REFERENCE_PATH}`
}

export function getPublicApiClient() {
  return createPublicApiClient({
    baseUrl: getPublicApiBaseUrl(),
    fetch: globalThis.fetch.bind(globalThis),
  })
}
