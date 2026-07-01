import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createIssuer,
  createOrientation as createOrientationFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createOrientation,
  deleteOrientation,
  updateOrientation,
} from "./orientation"

describe("orientation mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Orientation Code and Orientation Name before creating an Orientation", async () => {
    await expect(
      createOrientation({
        code: "  coin-alignment  ",
        name: "  Coin alignment  ",
      })
    ).resolves.toMatchObject({
      code: "coin-alignment",
      name: "Coin alignment",
    })
  })

  it("rejects duplicate Orientation Codes after normalization", async () => {
    await createOrientationFixture({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expect(
      createOrientation({
        code: " coin-alignment ",
        name: "Duplicate Coin alignment",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "orientation_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Orientation Codes instead of silently normalizing them", async () => {
    await expect(
      createOrientation({
        code: "Coin-Alignment",
        name: "Coin alignment",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "orientation_code_slug_check",
      }),
    })
  })

  it("allows duplicate Orientation Names when Orientation Codes differ", async () => {
    const firstOrientation = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const secondOrientation = await createOrientation({
      code: "medal-alignment",
      name: "Coin alignment",
    })

    expect(firstOrientation.name).toBe(secondOrientation.name)
    expect(firstOrientation.id).not.toBe(secondOrientation.id)
  })

  it("trims Orientation Code and Orientation Name before updating an Orientation", async () => {
    const existingOrientation = await createOrientationFixture({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expect(
      updateOrientation({
        id: existingOrientation.id,
        code: "  medal-alignment  ",
        name: "  Medal alignment  ",
      })
    ).resolves.toMatchObject({
      id: existingOrientation.id,
      code: "medal-alignment",
      name: "Medal alignment",
    })
  })

  it("returns null when the Orientation update target no longer exists", async () => {
    await expect(
      updateOrientation({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "coin-alignment",
        name: "Coin alignment",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when an Orientation Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-orientation-update",
      name: "Issuer for Orientation Update",
    })
    const createdOrientation = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      orientationId: createdOrientation.id,
      title: "Orientation-linked coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    const updatedOrientation = await updateOrientation({
      id: createdOrientation.id,
      code: "medal-alignment",
      name: "Medal alignment",
    })

    expect(updatedOrientation).toMatchObject({
      id: createdOrientation.id,
      code: "medal-alignment",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.orientationId).toBe(createdOrientation.id)
  })

  it("returns null when deleting a missing Orientation", async () => {
    await expect(
      deleteOrientation({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Orientation", async () => {
    const existingOrientation = await createOrientationFixture({
      code: "obsolete-orientation",
      name: "Obsolete Orientation",
    })

    await expect(
      deleteOrientation({
        id: existingOrientation.id,
      })
    ).resolves.toMatchObject({
      id: existingOrientation.id,
      code: "obsolete-orientation",
    })
  })

  it("rejects deleting an Orientation while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-orientation-delete",
      name: "Issuer for Orientation Delete",
    })
    const existingOrientation = await createOrientationFixture({
      code: "in-use-orientation",
      name: "In Use Orientation",
    })

    await createCoin({
      issuerId: issuer.id,
      orientationId: existingOrientation.id,
      title: "Orientation Restrict Delete Coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await expect(
      deleteOrientation({
        id: existingOrientation.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_orientation_id_orientation_id_fk",
      }),
    })
  })
})
