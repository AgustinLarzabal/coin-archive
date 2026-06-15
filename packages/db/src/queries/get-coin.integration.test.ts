import { describe, expect, it } from "vitest"
import { db } from "../index"
import { coinSurfaceKinds } from "../schema/coin-surface"
import { getCoin } from "./get-coin"
import {
  createCoin,
  createCoinSurface,
  createCoinSurfaceEngraver,
  createEdge,
  createEngraver,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoin integration", () => {
  useTestDatabaseIsolation(db)
  const [obverseKind, reverseKind, edgeSurfaceKind] = coinSurfaceKinds

  it("returns an image-aware Surface Set while keeping coin.edge limited to Edge classification data", async () => {
    const spain = await createIssuer({
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    })
    const letteredEdge = await createEdge({
      code: "lettered",
      name: "Lettered",
    })
    const engraver = await createEngraver({
      code: "alpha-engraver",
      name: "Alpha Engraver",
    })
    const coin = await createCoin({
      title: "Surface Detail Test Coin",
      issuerId: spain.id,
      edgeId: letteredEdge.id,
      createdAt: new Date("2026-06-15T00:00:00.000Z"),
    })
    const obverseSurface = await createCoinSurface({
      coinId: coin.id,
      kind: obverseKind,
      description: "Portrait right.",
      lettering: "FELIPE VI",
      thumbnailUrl: "https://example.com/coins/surface-detail-test/obverse-thumb",
      imageUrl: "https://example.com/coins/surface-detail-test/obverse-image",
    })

    await createCoinSurface({
      coinId: coin.id,
      kind: reverseKind,
      imageUrl: "https://example.com/coins/surface-detail-test/reverse-image",
    })
    await createCoinSurface({
      coinId: coin.id,
      kind: edgeSurfaceKind,
      thumbnailUrl: "https://example.com/coins/surface-detail-test/edge-thumb",
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: engraver.id,
    })

    const detail = await getCoin(coin.id)

    expect(detail).toMatchObject({
      id: coin.id,
      title: "Surface Detail Test Coin",
      issuer: {
        id: spain.id,
        code: "spain",
        isoCode: "ES",
        name: "Spain",
      },
      edge: {
        id: letteredEdge.id,
        code: "lettered",
        name: "Lettered",
      },
      surfaces: {
        obverse: {
          description: "Portrait right.",
          lettering: "FELIPE VI",
          thumbnailUrl:
            "https://example.com/coins/surface-detail-test/obverse-thumb",
          imageUrl:
            "https://example.com/coins/surface-detail-test/obverse-image",
          engravers: [
            {
              id: engraver.id,
              code: "alpha-engraver",
              name: "Alpha Engraver",
            },
          ],
        },
        reverse: {
          description: null,
          lettering: null,
          thumbnailUrl: null,
          imageUrl:
            "https://example.com/coins/surface-detail-test/reverse-image",
        },
        edge: {
          description: null,
          lettering: null,
          thumbnailUrl:
            "https://example.com/coins/surface-detail-test/edge-thumb",
          imageUrl: null,
        },
      },
    })
    expect(detail?.edge).not.toHaveProperty("description")
    expect(detail?.surfaces.edge).not.toHaveProperty("engravers")
  })
})
