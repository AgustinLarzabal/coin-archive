import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createComposition as createCompositionFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createComposition,
  deleteComposition,
  updateComposition,
} from "./composition"

describe("composition mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Composition Code and Composition Name before creating a Composition", async () => {
    await expect(
      createComposition({
        code: "  silver-900  ",
        name: "  Silver (.900)  ",
      })
    ).resolves.toMatchObject({
      code: "silver-900",
      name: "Silver (.900)",
    })
  })

  it("rejects duplicate Composition Codes after normalization", async () => {
    await createCompositionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    await expect(
      createComposition({
        code: " silver-900 ",
        name: "Duplicate Silver (.900)",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "composition_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Composition Codes instead of silently normalizing them", async () => {
    await expect(
      createComposition({
        code: "Silver 900",
        name: "Silver (.900)",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "composition_code_slug_check",
      }),
    })
  })

  it("allows duplicate Composition Names when Composition Codes differ", async () => {
    const firstComposition = await createComposition({
      code: "silver-500",
      name: "Silver",
    })
    const secondComposition = await createComposition({
      code: "silver-925",
      name: "Silver",
    })

    expect(firstComposition.name).toBe(secondComposition.name)
    expect(firstComposition.id).not.toBe(secondComposition.id)
  })

  it("trims Composition fields and updates updatedAt when updating a Composition", async () => {
    const existingComposition = await createCompositionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    const updatedComposition = await updateComposition({
      id: existingComposition.id,
      code: " silver-925 ",
      name: " Silver (.925) ",
    })

    expect(updatedComposition).toMatchObject({
      id: existingComposition.id,
      code: "silver-925",
      name: "Silver (.925)",
    })
    expect(updatedComposition?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      existingComposition.updatedAt.getTime()
    )
  })

  it("returns null when the Composition update target no longer exists", async () => {
    await expect(
      updateComposition({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "silver-900",
        name: "Silver (.900)",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Composition Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-composition-update",
      name: "Issuer for Composition Update",
    })
    const createdComposition = await createComposition({
      code: "silver-900",
      name: "Silver (.900)",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      compositionId: createdComposition.id,
      title: "Composition-linked coin",
      createdAt: new Date("2026-06-25T12:00:00.000Z"),
    })

    const updatedComposition = await updateComposition({
      id: createdComposition.id,
      code: "silver-925",
      name: "Silver (.925)",
    })

    expect(updatedComposition).toMatchObject({
      id: createdComposition.id,
      code: "silver-925",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.compositionId).toBe(createdComposition.id)
  })

  it("returns null when deleting a missing Composition", async () => {
    await expect(
      deleteComposition({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Composition", async () => {
    const existingComposition = await createCompositionFixture({
      code: "billon",
      name: "Billon",
    })

    await expect(
      deleteComposition({
        id: existingComposition.id,
      })
    ).resolves.toMatchObject({
      id: existingComposition.id,
      code: "billon",
    })
  })

  it("rejects deleting a Composition while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "test-issuer",
      name: "Test Issuer",
    })
    const existingComposition = await createCompositionFixture({
      code: "in-use-composition",
      name: "In Use Composition",
    })

    await createCoin({
      issuerId: issuer.id,
      compositionId: existingComposition.id,
      title: "Composition Restrict Delete Coin",
      createdAt: new Date("2026-06-25T00:00:00.000Z"),
    })

    await expect(
      deleteComposition({
        id: existingComposition.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_composition_id_composition_id_fk",
      }),
    })
  })
})
