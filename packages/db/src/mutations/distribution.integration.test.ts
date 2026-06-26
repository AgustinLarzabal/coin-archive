import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createDistribution as createDistributionFixture } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createDistribution } from "./distribution"

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
})
