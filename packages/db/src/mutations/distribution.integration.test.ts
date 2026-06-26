import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createDistribution as createDistributionFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createDistribution, updateDistribution } from "./distribution"

describe("distribution mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Distribution Code and Distribution Name before creating a Distribution", async () => {
    await expect(
      createDistribution({
        code: "  standard-circulation  ",
        name: "  Standard circulation  ",
      })
    ).resolves.toMatchObject({
      code: "standard-circulation",
      name: "Standard circulation",
    })
  })

  it("rejects duplicate Distribution Codes after normalization", async () => {
    await createDistributionFixture({
      code: "standard-circulation",
      name: "Standard circulation",
    })

    await expect(
      createDistribution({
        code: " standard-circulation ",
        name: "Duplicate standard circulation",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "distribution_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Distribution Codes instead of silently normalizing them", async () => {
    await expect(
      createDistribution({
        code: "Standard Circulation",
        name: "Standard circulation",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "distribution_code_slug_check",
      }),
    })
  })

  it("allows duplicate Distribution Names when Distribution Codes differ", async () => {
    const firstDistribution = await createDistribution({
      code: "circulating-commemorative",
      name: "Commemorative",
    })
    const secondDistribution = await createDistribution({
      code: "non-circulating-commemorative",
      name: "Commemorative",
    })

    expect(firstDistribution.name).toBe(secondDistribution.name)
    expect(firstDistribution.id).not.toBe(secondDistribution.id)
  })

  it("trims Distribution Code and Distribution Name before updating a Distribution", async () => {
    const existingDistribution = await createDistributionFixture({
      code: "standard-circulation",
      name: "Standard circulation",
    })

    await expect(
      updateDistribution({
        id: existingDistribution.id,
        code: "  circulating-commemorative  ",
        name: "  Circulating commemorative  ",
      })
    ).resolves.toMatchObject({
      id: existingDistribution.id,
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })
  })

  it("returns null when the Distribution update target no longer exists", async () => {
    await expect(
      updateDistribution({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "standard-circulation",
        name: "Standard circulation",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Distribution Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-distribution-update",
      name: "Issuer for Distribution Update",
    })
    const createdDistribution = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      distributionId: createdDistribution.id,
      title: "Distribution-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedDistribution = await updateDistribution({
      id: createdDistribution.id,
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })

    expect(updatedDistribution).toMatchObject({
      id: createdDistribution.id,
      code: "circulating-commemorative",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.distributionId).toBe(createdDistribution.id)
  })
})
