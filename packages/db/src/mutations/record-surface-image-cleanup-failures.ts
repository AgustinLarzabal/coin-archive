import { db } from "../client"
import { surfaceImageCleanupFailure } from "../schema/surface-image-cleanup-failure"

type RecordSurfaceImageCleanupFailuresInput = {
  deletedCoinId: string
  failures: Array<{
    errorMessage: string
    imageUrl: string
  }>
}

export async function recordSurfaceImageCleanupFailures({
  deletedCoinId,
  failures,
}: RecordSurfaceImageCleanupFailuresInput) {
  if (failures.length === 0) {
    return
  }

  await db.insert(surfaceImageCleanupFailure).values(
    failures.map((failure) => ({
      deletedCoinId,
      errorMessage: failure.errorMessage,
      imageUrl: failure.imageUrl,
    }))
  )
}
