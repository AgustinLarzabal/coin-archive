import { orientationListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { OrientationListResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class InvalidOrientationListResponseError extends Error {}
export class OrientationListRequestError extends Error {}

async function getOrientations(): Promise<OrientationListResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/orientations`)
  } catch (error) {
    throw new OrientationListRequestError("Orientation list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new OrientationListRequestError(
      `Orientation list request failed with HTTP ${response.status}`
    )
  }

  try {
    return orientationListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidOrientationListResponseError(
      "Orientation list response is invalid",
      { cause: error }
    )
  }
}

export function orientationListQueryOptions() {
  return queryOptions({
    queryKey: ["orientations", "list"] as const,
    queryFn: getOrientations,
    staleTime: Infinity,
  })
}
