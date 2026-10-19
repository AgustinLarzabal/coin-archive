import { rulingAuthorityListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { RulingAuthorityListResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class InvalidRulingAuthorityListResponseError extends Error {}
export class RulingAuthorityListRequestError extends Error {}

async function getRulingAuthorities(): Promise<RulingAuthorityListResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/v1/rulers`)
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

export function rulingAuthorityListQueryOptions() {
  return queryOptions({
    queryKey: ["rulers", "list"] as const,
    queryFn: getRulingAuthorities,
    staleTime: Infinity,
  })
}
