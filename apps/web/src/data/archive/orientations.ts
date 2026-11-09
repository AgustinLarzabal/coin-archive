import { coinOrientationListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { API_BASE_URL } from "@/config"

export class InvalidOrientationListResponseError extends Error {}
export class OrientationListRequestError extends Error {}

export function orientationListQueryOptions() {
  return queryOptions({
    queryKey: ["orientations", "list"] as const,
    queryFn: async () => {
      let response: Response
      try {
        response = await fetch(`${API_BASE_URL}/v1/orientations`)
      } catch (error) {
        throw new OrientationListRequestError(
          "Orientation list request failed",
          {
            cause: error,
          }
        )
      }
      if (!response.ok) {
        throw new OrientationListRequestError(
          `Orientation list request failed with HTTP ${response.status}`
        )
      }
      try {
        return coinOrientationListResponseSchema.parse(await response.json())
      } catch (error) {
        throw new InvalidOrientationListResponseError(
          "Orientation list response is invalid",
          { cause: error }
        )
      }
    },
    staleTime: Infinity,
  })
}
