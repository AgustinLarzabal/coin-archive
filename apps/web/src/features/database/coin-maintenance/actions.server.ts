import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  authorizeSurfaceImageUpload,
  removeSurfaceImageUpload,
  submitCreateCoin,
  submitDeleteCoin,
  submitUpdateCoin,
} from "./actions"
import type { CoinDraft } from "./actions"

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
  return submitUpdateCoin(collector, input, { replaceCoin: client.coins.replace })
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
