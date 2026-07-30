import { getPublicApiClient } from "../../../lib/public-api.server"
import { notFound } from "@tanstack/react-router"

export async function getPublicCoinDetail(coinId: string) {
  return (await getPublicApiClient().coins.detail({ uuid: coinId })).data
}

export async function loadCoinDetail(coinId: string) {
  try {
    return await getPublicCoinDetail(coinId)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      throw notFound()
    }
    throw error
  }
}
