import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createIssuer,
  createRim as createRimFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createRim, deleteRim, updateRim } from "./rim"

describe("rim mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Rim Code and Rim Name before creating a Rim", async () => {
    await expect(
      createRim({
        code: "  raised  ",
        name: "  Raised rim  ",
      })
    ).resolves.toMatchObject({
      code: "raised",
      name: "Raised rim",
    })
  })

  it("rejects duplicate Rim Codes after normalization", async () => {
    await createRimFixture({
      code: "raised",
      name: "Raised rim",
    })

    await expect(
      createRim({
        code: " raised ",
        name: "Duplicate Raised rim",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "rim_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Rim Codes instead of silently normalizing them", async () => {
    await expect(
      createRim({
        code: "Raised",
        name: "Raised rim",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "rim_code_slug_check",
      }),
    })
  })

  it("allows duplicate Rim Names when Rim Codes differ", async () => {
    const firstRim = await createRim({
      code: "raised",
      name: "Raised rim",
    })
    const secondRim = await createRim({
      code: "raised-variant",
      name: "Raised rim",
    })

    expect(firstRim.name).toBe(secondRim.name)
    expect(firstRim.id).not.toBe(secondRim.id)
  })

  it("trims Rim Code and Rim Name before updating a Rim", async () => {
    const existingRim = await createRimFixture({
      code: "raised",
      name: "Raised rim",
    })

    await expect(
      updateRim({
        id: existingRim.id,
        code: "  barred  ",
        name: "  Barred rim  ",
      })
    ).resolves.toMatchObject({
      id: existingRim.id,
      code: "barred",
      name: "Barred rim",
    })
  })

  it("returns null when the Rim update target no longer exists", async () => {
    await expect(
      updateRim({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "raised",
        name: "Raised rim",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Rim Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-rim-update",
      name: "Issuer for Rim Update",
    })
    const createdRim = await createRim({
      code: "raised",
      name: "Raised rim",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      rimId: createdRim.id,
      title: "Rim-linked coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    const updatedRim = await updateRim({
      id: createdRim.id,
      code: "barred",
      name: "Barred rim",
    })

    expect(updatedRim).toMatchObject({
      id: createdRim.id,
      code: "barred",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.rimId).toBe(createdRim.id)
  })

  it("returns null when deleting a missing Rim", async () => {
    await expect(
      deleteRim({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Rim", async () => {
    const existingRim = await createRimFixture({
      code: "obsolete-rim",
      name: "Obsolete rim",
    })

    await expect(
      deleteRim({
        id: existingRim.id,
      })
    ).resolves.toMatchObject({
      id: existingRim.id,
      code: "obsolete-rim",
    })
  })

  it("rejects deleting a Rim while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-rim-delete",
      name: "Issuer for Rim Delete",
    })
    const existingRim = await createRimFixture({
      code: "in-use-rim",
      name: "In Use rim",
    })

    await createCoin({
      issuerId: issuer.id,
      rimId: existingRim.id,
      title: "Rim Restrict Delete Coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await expect(
      deleteRim({
        id: existingRim.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_rim_id_rim_id_fk",
      }),
    })
  })
})
