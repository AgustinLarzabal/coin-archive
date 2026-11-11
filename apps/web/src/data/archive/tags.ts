import { tagListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { API_BASE_URL } from "@/config"

export class InvalidTagListResponseError extends Error {}
export class TagListRequestError extends Error {}

async function getTags() {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/tags`)
  } catch (error) {
    throw new TagListRequestError("Tag list request failed", { cause: error })
  }

  if (!response.ok)
    throw new TagListRequestError(
      `Tag list request failed with HTTP ${response.status}`
    )

  try {
    return tagListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidTagListResponseError("Tag list response is invalid", {
      cause: error,
    })
  }
}

export function tagListQueryOptions() {
  return queryOptions({
    queryKey: ["tags", "list"] as const,
    queryFn: getTags,
    staleTime: Infinity,
  })
}
