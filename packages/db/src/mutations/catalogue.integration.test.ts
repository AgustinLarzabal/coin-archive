import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { coinReference, db } from "../index"
import {
  createCatalogue as createCatalogueFixture,
  createCoin,
  createCoinReference,
  createIssuer,
} from "../testing/fixtures"
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

  it("rejects duplicate Catalogue codes ignoring case when updating", async () => {
    await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const romanCatalogue = await createCatalogueFixture({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })

    await expect(
      updateCatalogue({
        id: romanCatalogue.id,
        code: "km",
        title: romanCatalogue.title,
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

  it("allows duplicate Catalogue Titles when updating a different Catalogue", async () => {
    const firstCatalogue = await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const secondCatalogue = await createCatalogueFixture({
      code: "SCWC",
      title: "Second title",
    })

    await expect(
      updateCatalogue({
        id: secondCatalogue.id,
        code: secondCatalogue.code,
        title: firstCatalogue.title,
      })
    ).resolves.toMatchObject({
      id: secondCatalogue.id,
      title: firstCatalogue.title,
    })
  })

  it("preserves Catalogue Code casing when updating", async () => {
    const createdCatalogue = await createCatalogueFixture({
      code: "km",
      title: "Standard Catalog of World Coins",
    })

    await expect(
      updateCatalogue({
        id: createdCatalogue.id,
        code: "RiC",
        title: createdCatalogue.title,
      })
    ).resolves.toMatchObject({
      id: createdCatalogue.id,
      code: "RiC",
    })
  })

  it("keeps existing Catalogue References attached by Catalogue id when updating Catalogue Code", async () => {
    const createdCatalogue = await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const createdIssuer = await createIssuer({
      code: "test-issuer",
      name: "Test Issuer",
    })
    const createdCoin = await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: createdIssuer.id,
      title: "Test Coin",
    })
    const createdReference = await createCoinReference({
      catalogueId: createdCatalogue.id,
      coinId: createdCoin.id,
      number: "123",
    })

    await updateCatalogue({
      id: createdCatalogue.id,
      code: "RIC",
      title: createdCatalogue.title,
    })

    const [persistedReference] = await db
      .select()
      .from(coinReference)
      .where(eq(coinReference.id, createdReference.id))

    expect(persistedReference).toMatchObject({
      id: createdReference.id,
      catalogueId: createdCatalogue.id,
      coinId: createdCoin.id,
      number: "123",
    })
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
