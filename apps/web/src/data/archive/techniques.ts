import { techniqueListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { TechniqueListResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class InvalidTechniqueListResponseError extends Error {}
export class TechniqueListRequestError extends Error {}

async function getTechniques(): Promise<TechniqueListResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/v1/techniques`)
  } catch (error) {
    throw new TechniqueListRequestError("Technique list request failed", {
      cause: error,
    })
  }
  if (!response.ok) {
    throw new TechniqueListRequestError(
      `Technique list request failed with HTTP ${response.status}`
    )
  }
  try {
    return techniqueListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidTechniqueListResponseError(
      "Technique list response is invalid",
      { cause: error }
    )
  }
}

export function techniqueListQueryOptions() {
  return queryOptions({
    queryKey: ["techniques", "list"] as const,
    queryFn: getTechniques,
    staleTime: Infinity,
  })
}
