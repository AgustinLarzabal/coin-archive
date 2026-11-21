import { mintListResponseSchema } from "@coin-archive/api"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { MintListResponse } from "@coin-archive/api"

import { fetchArchive } from "./fetch.server"

export class InvalidMintListResponseError extends Error {}
export class MintListRequestError extends Error {}

async function getMints(): Promise<MintListResponse> {
  let response: Response

  try {
    response = await fetchArchive(`/v1/mints`)
  } catch (error) {
    throw new MintListRequestError("Mint list request failed", { cause: error })
  }

  if (!response.ok) {
    throw new MintListRequestError(
      `Mint list request failed with HTTP ${response.status}`
    )
  }

  try {
    return mintListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidMintListResponseError("Mint list response is invalid", {
      cause: error,
    })
  }
}

const getMintsOnServer = createServerFn({ method: "GET" }).handler(() =>
  getMints()
)

export function mintListQueryOptions() {
  return queryOptions({
    queryKey: ["mints", "list"] as const,
    queryFn: () => getMintsOnServer(),
    staleTime: Infinity,
  })
}
