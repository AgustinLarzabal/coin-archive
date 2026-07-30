import { createPublicApiClient } from "@coin-archive/api"

export function getPublicApiClient() {
  return createPublicApiClient({
    baseUrl:
      process.env.CLOUDFLARE_ENV === "production"
        ? "https://api.coinarchive.app"
        : process.env.CLOUDFLARE_ENV === "staging"
          ? "https://api.staging.coinarchive.app"
          : "http://127.0.0.1:8787",
    fetch,
  })
}
