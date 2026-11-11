import { shapeListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { ShapeListResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class InvalidShapeListResponseError extends Error {}
export class ShapeListRequestError extends Error {}

async function getShapes(): Promise<ShapeListResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/shapes`)
  } catch (error) {
    throw new ShapeListRequestError("Shape list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new ShapeListRequestError(
      `Shape list request failed with HTTP ${response.status}`
    )
  }

  try {
    return shapeListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidShapeListResponseError(
      "Shape list response is invalid",
      { cause: error }
    )
  }
}

export function shapeListQueryOptions() {
  return queryOptions({
    queryKey: ["shapes", "list"] as const,
    queryFn: getShapes,
    staleTime: Infinity,
  })
}
