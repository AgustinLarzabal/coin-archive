import { rulingAuthorityListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { RulingAuthorityListResponse } from "@coin-archive/api"

import { fetchArchive } from "./fetch.server"

export class InvalidRulingAuthorityListResponseError extends Error {}
export class RulingAuthorityListRequestError extends Error {}

async function getRulingAuthorities(): Promise<RulingAuthorityListResponse> {
  let response: Response

  try {
    response = await fetchArchive(`/v1/rulers`)
  } catch (error) {
    throw new RulingAuthorityListRequestError(
      "Ruling Authority list request failed",
      { cause: error }
    )
  }

  if (!response.ok) {
    throw new RulingAuthorityListRequestError(
      `Ruling Authority list request failed with HTTP ${response.status}`
    )
  }

  try {
    return rulingAuthorityListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidRulingAuthorityListResponseError(
      "Ruling Authority list response is invalid",
      { cause: error }
    )
  }
}

const getRulingAuthoritiesOnServer = createServerFn({ method: "GET" }).handler(
  () => getRulingAuthorities()
)

export function rulingAuthorityListQueryOptions() {
  return queryOptions({
    queryKey: ["rulers", "list"] as const,
    queryFn: () => getRulingAuthoritiesOnServer(),
    staleTime: 30_000,
  })
}
