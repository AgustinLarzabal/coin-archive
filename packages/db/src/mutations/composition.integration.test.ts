import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createComposition as createCompositionFixture } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createComposition } from "./composition"

describe("composition mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Composition Code, Composition Name, and Composition Description before creating a Composition", async () => {
    await expect(
      createComposition({
        code: "  silver-900  ",
        name: "  Silver (.900)  ",
        description: "  Ninety percent silver alloy.  ",
      })
    ).resolves.toMatchObject({
      code: "silver-900",
      name: "Silver (.900)",
      description: "Ninety percent silver alloy.",
    })
  })

  it("persists blank Composition Description as null", async () => {
    await expect(
      createComposition({
        code: "copper-nickel",
        name: "Copper-nickel",
        description: "   ",
      })
    ).resolves.toMatchObject({
      code: "copper-nickel",
      name: "Copper-nickel",
      description: null,
    })
  })

  it("rejects duplicate Composition Codes ignoring case", async () => {
    await createCompositionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    await expect(
      createComposition({
        code: "SILVER-900",
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
})
