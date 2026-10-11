import { queryOptions } from "@tanstack/react-query"
import { engraverListResponseSchema } from "@workspace/api"
import type { EngraverListResponse } from "@workspace/api"

import { API_BASE_URL } from "@/config"

export class InvalidEngraverListResponseError extends Error {}
export class EngraverListRequestError extends Error {}

async function getEngravers(): Promise<EngraverListResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/engravers`)
  } catch (error) {
    throw new EngraverListRequestError("Engraver list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new EngraverListRequestError(
      `Engraver list request failed with HTTP ${response.status}`
    )
  }

  try {
    return engraverListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidEngraverListResponseError(
      "Engraver list response is invalid",
      { cause: error }
    )
  }
}

export function engraverListQueryOptions() {
  return queryOptions({
    queryKey: ["engravers", "list"] as const,
    queryFn: getEngravers,
    staleTime: Infinity,
  })
}
