import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { db, surfaceImageCleanupFailure } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { recordSurfaceImageCleanupFailures } from "./record-surface-image-cleanup-failures"

const DELETED_COIN_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"

describe("Surface Image cleanup failure recording integration", () => {
  useTestDatabaseIsolation(db)

  it("persists each failed cleanup with the deleted Coin and exact Surface Image URL", async () => {
    await recordSurfaceImageCleanupFailures({
      deletedCoinId: DELETED_COIN_ID,
      failures: [
        {
          imageUrl: "https://images.example.test/surface-images/opaque-obverse",
          errorMessage: "R2 unavailable",
        },
        {
          imageUrl: "https://images.example.test/surface-images/opaque-edge",
          errorMessage: "Request timed out",
        },
      ],
    })

    const failures = await db
      .select({
        deletedCoinId: surfaceImageCleanupFailure.deletedCoinId,
        errorMessage: surfaceImageCleanupFailure.errorMessage,
        imageUrl: surfaceImageCleanupFailure.imageUrl,
      })
      .from(surfaceImageCleanupFailure)
      .where(eq(surfaceImageCleanupFailure.deletedCoinId, DELETED_COIN_ID))
      .orderBy(surfaceImageCleanupFailure.imageUrl)

    expect(failures).toEqual([
      {
        deletedCoinId: DELETED_COIN_ID,
        errorMessage: "Request timed out",
        imageUrl: "https://images.example.test/surface-images/opaque-edge",
      },
      {
        deletedCoinId: DELETED_COIN_ID,
        errorMessage: "R2 unavailable",
        imageUrl: "https://images.example.test/surface-images/opaque-obverse",
      },
    ])
  })
})
