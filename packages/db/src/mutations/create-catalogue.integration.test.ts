import { describe, expect, it } from "vitest"

import { db } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createCatalogue } from "./create-catalogue"

describe("createCatalogue integration", () => {
  useTestDatabaseIsolation(db)

  it("persists trimmed Catalogue Code and Catalogue Title while preserving Catalogue Code casing", async () => {
    const createdCatalogue = await createCatalogue({
      code: " KM ",
      title: " Standard Catalog of World Coins ",
    })

    expect(createdCatalogue.code).toBe("KM")
    expect(createdCatalogue.title).toBe("Standard Catalog of World Coins")
  })

  it("rejects duplicate Catalogue Codes ignoring case", async () => {
    await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await expect(
      createCatalogue({
        code: "km",
        title: "Another title",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "catalogue_code_lower_unique_idx",
      }),
    })
  })

  it("allows duplicate Catalogue Titles when the Catalogue Codes differ", async () => {
    const firstCatalogue = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const secondCatalogue = await createCatalogue({
      code: "SCWC",
      title: "Standard Catalog of World Coins",
    })

    expect(firstCatalogue.title).toBe(secondCatalogue.title)
    expect(firstCatalogue.id).not.toBe(secondCatalogue.id)
  })
})
