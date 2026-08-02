import { createORPCClient } from "@orpc/client"
import type { ContractRouterClient } from "@orpc/contract"
import { OpenAPILink } from "@orpc/openapi-client/fetch"
import { maintenanceApiContract, publicApiContract } from "./contract"

export type PublicApiClient = ContractRouterClient<typeof publicApiContract>
export type MaintenanceApiClient = ContractRouterClient<
  typeof maintenanceApiContract
>

export function createPublicApiClient({
  baseUrl,
  fetch,
}: {
  baseUrl: string
  fetch: typeof globalThis.fetch
}): PublicApiClient {
  return createORPCClient(
    new OpenAPILink(publicApiContract, {
      url: baseUrl,
      fetch: normalizeProblemJsonFetch(fetch),
    })
  )
}

export function createMaintenanceApiClient({
  baseUrl,
  fetch,
}: {
  baseUrl: string
  fetch: typeof globalThis.fetch
}): MaintenanceApiClient {
  return createORPCClient(
    new OpenAPILink(maintenanceApiContract, {
      url: baseUrl,
      fetch: normalizeProblemJsonFetch(fetch),
    })
  )
}

function normalizeProblemJsonFetch(
  fetchImplementation: typeof globalThis.fetch
) {
  return async (...args: Parameters<typeof globalThis.fetch>) => {
    const response = await fetchImplementation(...args)
    if (
      !response.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/problem+json")
    ) {
      return response
    }

    const headers = new Headers(response.headers)
    headers.set("Content-Type", "application/json")
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
