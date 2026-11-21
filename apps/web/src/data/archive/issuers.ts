import { issuerListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { IssuerListResponse } from "@coin-archive/api"

import { fetchArchive } from "./fetch.server"

export class InvalidIssuerListResponseError extends Error {}
export class IssuerListRequestError extends Error {}

async function getIssuers(): Promise<IssuerListResponse> {
  let response: Response

  try {
    response = await fetchArchive(`/v1/issuers`)
  } catch (error) {
    throw new IssuerListRequestError("Issuer list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new IssuerListRequestError(
      `Issuer list request failed with HTTP ${response.status}`
    )
  }

  try {
    return issuerListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidIssuerListResponseError(
      "Issuer list response is invalid",
      { cause: error }
    )
  }
}

const getIssuersOnServer = createServerFn({ method: "GET" }).handler(() =>
  getIssuers()
)

export function issuerListQueryOptions() {
  return queryOptions({
    queryKey: ["issuers", "list"] as const,
    queryFn: () => getIssuersOnServer(),
    staleTime: Infinity,
  })
}
