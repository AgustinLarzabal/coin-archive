import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  coinDraftSchema,
  createAuthorizationError,
  createFieldErrorResult,
  createFormErrorResult,
  deleteCoinInputSchema,
  getCoinCreateApiError,
  getCoinReplaceApiError,
  getSurfaceImageApiError,
  hasCoinMaintenanceAccess,
  mapDraftToCreateBody,
  mapDraftToReplaceBody,
  updateCoinInputSchema,
  validateInput,
} from "./actions"
import type {
  CoinCreateDependencies,
  CoinDeleteDependencies,
  CoinDeleteMutationResult,
  CoinDraft,
  CoinMutationErrorResult,
  CoinMutationResult,
  CoinReplaceDependencies,
  DeleteCoinInput,
  SurfaceImageUploadAuthorization,
  SurfaceImageUploadDependencies,
  SurfaceImageUploadRemovalDependencies,
  SurfaceImageUploadRequest,
  UpdateCoinInput,
} from "./actions"

export async function submitCreateCoin(
  collector: CollectorWithRole | null,
  input: CoinDraft,
  dependencies?: CoinCreateDependencies
): Promise<CoinMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) return createAuthorizationError()
  const validation = validateInput(coinDraftSchema, input)
  if (!validation.success) return validation.result
  try {
    const resolved = dependencies ?? missingServerDependencies()
    const created = await resolved.createCoin({
      headers: { "idempotency-key": resolved.createIdempotencyKey() },
      body: mapDraftToCreateBody(validation.data),
    })
    return {
      status: "success",
      coinId: created.body.data.id,
      message: "Coin created.",
    }
  } catch (error) {
    return getCoinCreateApiError(error)
  }
}

export async function submitUpdateCoin(
  collector: CollectorWithRole | null,
  input: UpdateCoinInput,
  dependencies?: CoinReplaceDependencies
): Promise<CoinMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) return createAuthorizationError()
  const validation = validateInput(updateCoinInputSchema, input)
  if (!validation.success) return validation.result
  const { id, etag, ...draft } = validation.data
  try {
    const replaced = await (
      dependencies ?? missingServerDependencies()
    ).replaceCoin({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: mapDraftToReplaceBody(draft),
    })
    return {
      status: "success",
      coinId: replaced.body.data.id,
      message: "Saved.",
    }
  } catch (error) {
    return getCoinReplaceApiError(error)
  }
}

export async function submitDeleteCoin(
  collector: CollectorWithRole | null,
  input: DeleteCoinInput,
  dependencies?: CoinDeleteDependencies
): Promise<CoinDeleteMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) return createAuthorizationError()
  const validation = validateInput(deleteCoinInputSchema, input)
  if (!validation.success) return validation.result
  try {
    const resolved = dependencies ?? missingServerDependencies()
    const summary = (
      await resolved.getCoinMaintenanceDeleteSummary({
        uuid: validation.data.id,
      })
    ).data
    if (validation.data.confirmationTitle !== summary.title) {
      return createFieldErrorResult({
        confirmationTitle:
          "Enter the current Coin Title exactly to confirm deletion.",
      })
    }
    await resolved.deleteCoin({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return {
      status: "success",
      message: "Coin deleted.",
      redirectTo: "/database/coins",
    }
  } catch (error) {
    return getCoinReplaceApiError(error)
  }
}

export async function authorizeSurfaceImageUpload(
  input: SurfaceImageUploadRequest,
  dependencies?: SurfaceImageUploadDependencies
): Promise<SurfaceImageUploadAuthorization | CoinMutationErrorResult> {
  try {
    const resolved = dependencies ?? missingServerDependencies()
    const result = await resolved.authorizeUpload({
      headers: { "idempotency-key": resolved.createIdempotencyKey() },
      body: input as {
        surface: "obverse" | "reverse" | "edge"
        contentType: "image/jpeg" | "image/png" | "image/webp"
        contentLength: number
      },
    })
    return {
      reference: result.body.reference,
      uploadUrl: result.body.uploadUrl,
    }
  } catch (error) {
    return createFormErrorResult(getSurfaceImageApiError(error))
  }
}

export async function removeSurfaceImageUpload(
  input: { reference: string; surface: "obverse" | "reverse" | "edge" },
  dependencies?: SurfaceImageUploadRemovalDependencies
): Promise<void | CoinMutationErrorResult> {
  try {
    await (dependencies ?? missingServerDependencies()).cancelUpload({
      body: input,
    })
  } catch (error) {
    return createFormErrorResult(getSurfaceImageApiError(error))
  }
}

export async function createCoin(
  collector: CollectorWithRole | null,
  input: CoinDraft
) {
  const client = await getMaintenanceApiClient()
  return submitCreateCoin(collector, input, {
    createCoin: client.coins.create,
    createIdempotencyKey: () => crypto.randomUUID(),
  })
}

export async function replaceCoin(
  collector: CollectorWithRole | null,
  input: CoinDraft & { id: string; etag: string }
) {
  const client = await getMaintenanceApiClient()
  return submitUpdateCoin(collector, input, {
    replaceCoin: client.coins.replace,
  })
}

export async function deleteCoin(
  collector: CollectorWithRole | null,
  input: { confirmationTitle: string; etag: string; id: string }
) {
  const client = await getMaintenanceApiClient()
  return submitDeleteCoin(collector, input, {
    deleteCoin: client.coins.delete,
    getCoinMaintenanceDeleteSummary: client.coins.deleteSummary,
  })
}

export async function authorizeCoinSurfaceImageUpload(input: {
  contentLength: number
  contentType: string
  surface: "obverse" | "reverse" | "edge"
}) {
  const client = await getMaintenanceApiClient()
  return authorizeSurfaceImageUpload(input, {
    authorizeUpload: client.surfaceImageUploads.authorize,
    createIdempotencyKey: () => crypto.randomUUID(),
  })
}

export async function cancelCoinSurfaceImageUpload(input: {
  reference: string
  surface: "obverse" | "reverse" | "edge"
}) {
  const client = await getMaintenanceApiClient()
  return removeSurfaceImageUpload(input, {
    cancelUpload: client.surfaceImageUploads.cancel,
  })
}

function missingServerDependencies(): never {
  throw new Error(
    "Coin Maintenance orchestration must be called through its server-function boundary."
  )
}
