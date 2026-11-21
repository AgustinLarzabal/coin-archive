import { techniqueListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { TechniqueListResponse } from "@coin-archive/api"

import { fetchArchive } from "./fetch.server"

export class InvalidTechniqueListResponseError extends Error {}
export class TechniqueListRequestError extends Error {}

async function getTechniques(): Promise<TechniqueListResponse> {
  let response: Response

  try {
    response = await fetchArchive(`/v1/techniques`)
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

const getTechniquesOnServer = createServerFn({ method: "GET" }).handler(() =>
  getTechniques()
)

export function techniqueListQueryOptions() {
  return queryOptions({
    queryKey: ["techniques", "list"] as const,
    queryFn: () => getTechniquesOnServer(),
    staleTime: 30_000,
  })
}
