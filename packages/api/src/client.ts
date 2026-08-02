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
    new OpenAPILink(publicApiContract, { url: baseUrl, fetch })
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
    new OpenAPILink(maintenanceApiContract, { url: baseUrl, fetch })
  )
}
