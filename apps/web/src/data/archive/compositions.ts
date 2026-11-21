import { compositionListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { CompositionListResponse } from "@coin-archive/api"

import { fetchArchive } from "./fetch.server"

export class InvalidCompositionListResponseError extends Error {}
export class CompositionListRequestError extends Error {}

async function getCompositions(): Promise<CompositionListResponse> {
  let response: Response

  try {
    response = await fetchArchive(`/v1/compositions`)
  } catch (error) {
    throw new CompositionListRequestError("Composition list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new CompositionListRequestError(
      `Composition list request failed with HTTP ${response.status}`
    )
  }

  try {
    return compositionListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidCompositionListResponseError(
      "Composition list response is invalid",
      { cause: error }
    )
  }
}

const getCompositionsOnServer = createServerFn({ method: "GET" }).handler(() =>
  getCompositions()
)

export function compositionListQueryOptions() {
  return queryOptions({
    queryKey: ["compositions", "list"] as const,
    queryFn: () => getCompositionsOnServer(),
    staleTime: Infinity,
  })
}
