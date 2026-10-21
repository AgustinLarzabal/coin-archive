import { distributionListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import type { DistributionListResponse } from "@coin-archive/api"

import { API_BASE_URL } from "@/config"

export class InvalidDistributionListResponseError extends Error {}
export class DistributionListRequestError extends Error {}

async function getDistributions(): Promise<DistributionListResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/v1/distributions`)
  } catch (error) {
    throw new DistributionListRequestError("Distribution list request failed", {
      cause: error,
    })
  }
  if (!response.ok) {
    throw new DistributionListRequestError(
      `Distribution list request failed with HTTP ${response.status}`
    )
  }
  try {
    return distributionListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidDistributionListResponseError(
      "Distribution list response is invalid",
      { cause: error }
    )
  }
}

export function distributionListQueryOptions() {
  return queryOptions({
    queryKey: ["distributions", "list"] as const,
    queryFn: getDistributions,
    staleTime: Infinity,
  })
}
