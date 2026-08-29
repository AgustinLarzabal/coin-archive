import { createServerFn } from "@tanstack/react-start"

import { getRequestAuthSession } from "@/lib/auth-session.server"

import {
  authorizeCoinSurfaceImageUpload,
  cancelCoinSurfaceImageUpload,
  createCoin,
  deleteCoin,
  replaceCoin,
} from "./actions.server"
import type { CoinDraft } from "./actions"

export const createCoinMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CoinDraft) => data)
  .handler(async ({ data }) => {
    const session = await getRequestAuthSession()
    return createCoin(session?.user ?? null, data)
  })

export const replaceCoinMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CoinDraft & { id: string; etag: string }) => data)
  .handler(async ({ data }) => {
    const session = await getRequestAuthSession()
    return replaceCoin(session?.user ?? null, data)
  })

export const deleteCoinMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { confirmationTitle: string; etag: string; id: string }) => data
  )
  .handler(async ({ data }) => {
    const session = await getRequestAuthSession()
    return deleteCoin(session?.user ?? null, data)
  })

export const authorizeCoinSurfaceImageUploadMutation = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      surface: "obverse" | "reverse" | "edge"
      contentType: string
      contentLength: number
    }) => data
  )
  .handler(({ data }) => authorizeCoinSurfaceImageUpload(data))

export const cancelCoinSurfaceImageUploadMutation = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: { surface: "obverse" | "reverse" | "edge"; reference: string }) =>
      data
  )
  .handler(({ data }) => cancelCoinSurfaceImageUpload(data))
