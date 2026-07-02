import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCoinRuler,
  createIssuer as createIssuerFixture,
  createRuler as createRulerFixture,
  createRulerGroup,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createRuler, deleteRuler, updateRuler } from "./ruler"

describe("ruler mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Ruler fields before creating a Ruler", async () => {
    const rulerGroup = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await expect(
      createRuler({
        code: "  louis-xiv  ",
        name: "  Louis XIV  ",
        rulerGroupId: ` ${rulerGroup.id} `,
      })
    ).resolves.toMatchObject({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: rulerGroup.id,
    })
  })

  it("allows creating a Ruler without a Ruler Group", async () => {
    await expect(
      createRuler({
        code: "liberty",
        name: "Liberty",
        rulerGroupId: null,
      })
    ).resolves.toMatchObject({
      code: "liberty",
      name: "Liberty",
      rulerGroupId: null,
    })
  })

  it("rejects duplicate Ruler Codes after normalization", async () => {
    await createRulerFixture({
      code: "louis-xiv",
      name: "Louis XIV",
    })

    await expect(
      createRuler({
        code: " louis-xiv ",
        name: "Duplicate Louis XIV",
        rulerGroupId: null,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "ruler_code_unique_idx",
      }),
    })
  })

  it("rejects invalid Ruler Codes instead of silently normalizing them", async () => {
    await expect(
      createRuler({
        code: "Louis-XIV",
        name: "Louis XIV",
        rulerGroupId: null,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "ruler_code_slug_check",
      }),
    })
  })

  it("allows duplicate Ruler Names when Ruler Codes differ", async () => {
    const firstRuler = await createRuler({
      code: "felipe-v",
      name: "Felipe",
      rulerGroupId: null,
    })
    const secondRuler = await createRuler({
      code: "felipe-vi",
      name: "Felipe",
      rulerGroupId: null,
    })

    expect(firstRuler.name).toBe(secondRuler.name)
    expect(firstRuler.id).not.toBe(secondRuler.id)
  })

  it("trims Ruler fields and updates the Ruler Group assignment", async () => {
    const firstGroup = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const secondGroup = await createRulerGroup({
      code: "house-of-habsburg",
      name: "House of Habsburg",
    })
    const existingRuler = await createRulerFixture({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: firstGroup.id,
    })

    await expect(
      updateRuler({
        id: existingRuler.id,
        code: "  felipe-vi  ",
        name: "  Felipe VI  ",
        rulerGroupId: ` ${secondGroup.id} `,
      })
    ).resolves.toMatchObject({
      id: existingRuler.id,
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: secondGroup.id,
    })
  })

  it("allows clearing the Ruler Group during update", async () => {
    const rulerGroup = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const existingRuler = await createRulerFixture({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: rulerGroup.id,
    })

    await expect(
      updateRuler({
        id: existingRuler.id,
        code: existingRuler.code,
        name: existingRuler.name,
        rulerGroupId: " ",
      })
    ).resolves.toMatchObject({
      id: existingRuler.id,
      rulerGroupId: null,
    })
  })

  it("returns null when the Ruler update target no longer exists", async () => {
    await expect(
      updateRuler({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "louis-xiv",
        name: "Louis XIV",
        rulerGroupId: null,
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin Ruler Attributions when a Ruler Code changes", async () => {
    const issuer = await createIssuerFixture({
      code: "france",
      isoCode: "FR",
      name: "France",
    })
    const existingRuler = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: null,
    })
    const coin = await createCoin({
      issuerId: issuer.id,
      title: "Test coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: coin.id,
      rulerId: existingRuler.id,
      rulerOrder: 1,
    })

    const updatedRuler = await updateRuler({
      id: existingRuler.id,
      code: "louis-the-great",
      name: "Louis XIV",
      rulerGroupId: null,
    })

    expect(updatedRuler).toMatchObject({
      id: existingRuler.id,
      code: "louis-the-great",
    })

    const persistedCoinRuler = await db.query.coinRuler.findFirst({
      where: (coinRuler, { eq }) => eq(coinRuler.rulerId, existingRuler.id),
    })

    expect(persistedCoinRuler).toMatchObject({
      coinId: coin.id,
      rulerId: existingRuler.id,
    })
  })

  it("returns null when deleting a missing Ruler", async () => {
    await expect(
      deleteRuler({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Ruler", async () => {
    const existingRuler = await createRulerFixture({
      code: "obsolete-ruler",
      name: "Obsolete Ruler",
    })

    await expect(
      deleteRuler({
        id: existingRuler.id,
      })
    ).resolves.toMatchObject({
      id: existingRuler.id,
      code: "obsolete-ruler",
    })
  })

  it("rejects deleting a Ruler while Coins still have Ruler Attributions to it", async () => {
    const issuer = await createIssuerFixture({
      code: "france",
      isoCode: "FR",
      name: "France",
    })
    const existingRuler = await createRulerFixture({
      code: "louis-xiv",
      name: "Louis XIV",
    })
    const coin = await createCoin({
      issuerId: issuer.id,
      title: "Test coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: coin.id,
      rulerId: existingRuler.id,
      rulerOrder: 1,
    })

    await expect(
      deleteRuler({
        id: existingRuler.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_ruler_ruler_id_ruler_id_fk",
      }),
    })
  })
})
