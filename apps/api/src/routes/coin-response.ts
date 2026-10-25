import {
  COIN_LIST_MAX_PAGE_SIZE,
  coinDetailResponseSchema,
  coinFaceValueResponseSchema,
  coinListItemResponseSchema as sharedCoinListItemResponseSchema,
  coinListResponseSchema as sharedCoinListResponseSchema,
  currencyResponseSchema,
  issuerResponseSchema,
  missingCoinSurfaceResponse,
  missingCoinSurfaceWithEngraversResponse,
} from "@coin-archive/api"
import { z } from "@hono/zod-openapi"
import { toCurrencyResponse } from "./currency-response.js"
import type {
  CoinDetailResponse,
  CoinFaceValueResponse,
  CoinListItemResponse,
} from "@coin-archive/api"
import type { Coin, CoinListItem } from "@coin-archive/db"

const issuerSchema = issuerResponseSchema.openapi("Issuer")
const currencySchema = currencyResponseSchema.openapi("Currency")
const faceValueSchema = coinFaceValueResponseSchema
  .safeExtend({ currency: currencySchema })
  .openapi("FaceValue")
export const coinSchema = coinDetailResponseSchema
  .safeExtend({
    issuer: issuerSchema,
    faceValue: z.union([faceValueSchema, z.null()]),
  })
  .openapi("Coin")
const coinListItemResponseSchema = sharedCoinListItemResponseSchema
  .safeExtend({
    issuer: issuerSchema,
    faceValue: z.union([faceValueSchema, z.null()]),
  })
  .openapi("CoinListItem")
export const coinListResponseSchema = sharedCoinListResponseSchema
  .safeExtend({
    coins: z.array(coinListItemResponseSchema).max(COIN_LIST_MAX_PAGE_SIZE),
  })
  .openapi("CoinListResponse")

function toCoinResponseFields(coin: Coin | CoinListItem) {
  return {
    id: coin.id,
    title: coin.title,
    distribution: coin.distribution,
    firstIssueYear: coin.firstIssueYear,
    lastIssueYear: coin.lastIssueYear,
    issuer: { name: coin.issuer.name, code: coin.issuer.code },
    createdAt: coin.createdAt.toISOString(),
    updatedAt: coin.updatedAt.toISOString(),
  }
}

function toPublicImageUrl(imageBaseUrl: string | undefined, imageKey: string) {
  if (!imageBaseUrl) {
    throw new Error("IMAGE_BASE_URL is required for persisted image keys")
  }

  const encodedKey = imageKey.split("/").map(encodeURIComponent).join("/")
  return new URL(encodedKey, `${imageBaseUrl}/`).href
}

function toCoinSurfaceResponse(
  surface: NonNullable<Coin["edge"]>,
  imageBaseUrl: string | undefined
) {
  return {
    description: surface.description,
    imageUrl: surface.imageKey
      ? toPublicImageUrl(imageBaseUrl, surface.imageKey)
      : null,
    createdAt: surface.createdAt.toISOString(),
    updatedAt: surface.updatedAt.toISOString(),
  }
}

function toCoinSurfaceWithEngraversResponse(
  surface: NonNullable<Coin["obverse"]>,
  imageBaseUrl: string | undefined
) {
  return {
    ...toCoinSurfaceResponse(surface, imageBaseUrl),
    engravers: surface.engravers.map((engraver) => ({
      slug: engraver.slug,
      fullName: engraver.fullName,
      createdAt: engraver.createdAt.toISOString(),
      updatedAt: engraver.updatedAt.toISOString(),
    })),
  }
}

export function toCoinDetailResponse(
  coin: Coin,
  imageBaseUrl: string | undefined
): CoinDetailResponse {
  return {
    ...toCoinResponseFields(coin),
    distributionName: coin.distributionName,
    size: coin.size,
    thickness: coin.thickness,
    weight: coin.weight,
    faceValue: toCoinFaceValueResponse(coin.denomination),
    rulers: coin.rulingAuthorityAttributions.map(
      ({ slug, name, role, tenure }) => ({ slug, name, role, tenure })
    ),
    mints: coin.mints.map(
      ({ id, slug, name, place, country, startYear, endYear, operating }) => ({
        id,
        slug,
        name,
        place,
        country: { name: country.name, code: country.code },
        startYear,
        endYear,
        operating,
      })
    ),
    obverse: coin.obverse
      ? toCoinSurfaceWithEngraversResponse(coin.obverse, imageBaseUrl)
      : { ...missingCoinSurfaceWithEngraversResponse },
    reverse: coin.reverse
      ? toCoinSurfaceWithEngraversResponse(coin.reverse, imageBaseUrl)
      : { ...missingCoinSurfaceWithEngraversResponse },
    edge: coin.edge
      ? toCoinSurfaceResponse(coin.edge, imageBaseUrl)
      : { ...missingCoinSurfaceResponse },
  }
}

function toCoinFaceValueResponse(
  denomination: Coin["denomination"] | CoinListItem["denomination"]
): CoinFaceValueResponse | null {
  return denomination
    ? {
        label: denomination.label,
        numericValue: Number(denomination.amount),
        currency: toCurrencyResponse(denomination.currency),
      }
    : null
}

export function toCoinListItemResponse(
  coin: CoinListItem,
  imageBaseUrl: string | undefined
): CoinListItemResponse {
  return {
    ...toCoinResponseFields(coin),
    faceValue: toCoinFaceValueResponse(coin.denomination),
    obverseImageUrl: coin.obverseImageKey
      ? toPublicImageUrl(imageBaseUrl, coin.obverseImageKey)
      : null,
    reverseImageUrl: coin.reverseImageKey
      ? toPublicImageUrl(imageBaseUrl, coin.reverseImageKey)
      : null,
  }
}
