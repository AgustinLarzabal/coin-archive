import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createCatalogue as createCatalogueFixture } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createCatalogue, updateCatalogue } from "./catalogue"

describe("catalogue mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims surrounding whitespace before creating a Catalogue", async () => {
    await expect(
      createCatalogue({
        code: "  KM  ",
        title: "  Standard Catalog of World Coins  ",
      })
    ).resolves.toMatchObject({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
  })

  it("rejects duplicate Catalogue codes ignoring case", async () => {
    await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await expect(
      createCatalogue({
        code: "km",
        title: "Duplicate Standard Catalog of World Coins",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "catalogue_code_lower_unique_idx",
      }),
    })
  })

  it("trims surrounding whitespace before updating a Catalogue", async () => {
    const createdCatalogue = await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await expect(
      updateCatalogue({
        id: createdCatalogue.id,
        code: "  RIC  ",
        title: "  Roman Imperial Coinage  ",
      })
    ).resolves.toMatchObject({
      id: createdCatalogue.id,
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
  })

  it("returns null when updating a missing Catalogue", async () => {
    await expect(
      updateCatalogue({
        id: "7281ad03-635d-4214-a936-c49681664e65",
        code: "KM",
        title: "Standard Catalog of World Coins",
      })
    ).resolves.toBeNull()
  })

  it("updates updatedAt when a Catalogue changes", async () => {
    const createdCatalogue = await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await new Promise((resolve) => {
      setTimeout(resolve, 10)
    })

    const updatedCatalogue = await updateCatalogue({
      id: createdCatalogue.id,
      code: "KM",
      title: "Standard Catalog of World Coinage",
    })

    expect(updatedCatalogue).not.toBeNull()
    expect(updatedCatalogue?.updatedAt.getTime()).toBeGreaterThan(
      createdCatalogue.updatedAt.getTime()
    )
  })
})
