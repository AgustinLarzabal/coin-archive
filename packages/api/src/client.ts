import { createORPCClient } from "@orpc/client"
import type { ContractRouterClient } from "@orpc/contract"
import { OpenAPILink } from "@orpc/openapi-client/fetch"
import { publicApiContract } from "./contract"

export type PublicApiClient = ContractRouterClient<typeof publicApiContract>

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
