import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { catalogue, coinReference, db } from "../index"
import {
  createCatalogue as createCatalogueFixture,
  createCoin,
  createCoinReference,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createCatalogue,
  createCatalogueIdempotently,
  createCatalogueIdempotentlyWithDatabase,
  deleteCatalogue,
  deleteCatalogueIfVersionWithDatabase,
  replaceCatalogueWithDatabase,
  updateCatalogue,
} from "./catalogue"

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

  it("persists and replays an identical idempotent create response", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "catalogue-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " KM ", title: " World Coins " },
    }

    const first = await createCatalogueIdempotently(input)
    const retry = await createCatalogueIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      catalogue: { code: "KM", title: "World Coins", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      catalogue:
        first.status === "created" ? first.catalogue : expect.anything(),
    })
    await expect(db.query.catalogue.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Catalogue create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "catalogue-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "KM", title: "World Coins" },
    }
    await createCatalogueIdempotently(input)

    await expect(
      createCatalogueIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "RIC", title: "Roman Imperial Coinage" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.catalogue.findMany()).resolves.toHaveLength(1)
  })

  it("supports request-scoped, atomically versioned API mutations", async () => {
    const created = await createCatalogueIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "KM", title: "World Coins" },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceCatalogueWithDatabase(db, {
        id: created.catalogue.id,
        expectedVersion: 1,
        code: " RIC ",
        title: " Roman Imperial Coinage ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      catalogue: {
        version: 2,
        code: "RIC",
        title: "Roman Imperial Coinage",
      },
    })
    await expect(
      replaceCatalogueWithDatabase(db, {
        id: created.catalogue.id,
        expectedVersion: 1,
        code: "KM",
        title: "World Coins",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteCatalogueIfVersionWithDatabase(db, {
        id: created.catalogue.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteCatalogueIfVersionWithDatabase(db, {
        id: created.catalogue.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
    await expect(
      deleteCatalogueIfVersionWithDatabase(db, {
        id: created.catalogue.id,
        expectedVersion: 2,
      })
    ).resolves.toStrictEqual({ status: "missing" })
  })

  it("preserves Catalogue constraints through versioned API mutations", async () => {
    const first = await createCatalogueFixture({
      code: "KM",
      title: "World Coins",
    })
    const second = await createCatalogueFixture({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })

    await expect(
      replaceCatalogueWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "km",
        title: second.title,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "catalogue_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-catalogue-delete-issuer",
      name: "Versioned Catalogue Delete Issuer",
    })
    const coin = await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      title: "Versioned Catalogue Delete Coin",
    })
    await createCoinReference({
      catalogueId: first.id,
      coinId: coin.id,
      number: "123",
    })

    await expect(
      deleteCatalogueIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_reference_catalogue_id_catalogue_id_fk",
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

  it("returns null when deleting a missing Catalogue", async () => {
    await expect(
      deleteCatalogue({
        id: "7281ad03-635d-4214-a936-c49681664e65",
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

  it("deletes a Catalogue that has no Coin References", async () => {
    const createdCatalogue = await createCatalogueFixture({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await expect(
      deleteCatalogue({
        id: createdCatalogue.id,
      })
    ).resolves.toMatchObject({
      id: createdCatalogue.id,
      code: "KM",
    })

    const persistedCatalogue = await db.query.catalogue.findFirst({
      where: eq(catalogue.id, createdCatalogue.id),
    })

    expect(persistedCatalogue).toBeUndefined()
  })

  it("rejects deleting a Catalogue while Coin References still use it", async () => {
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

    await createCoinReference({
      catalogueId: createdCatalogue.id,
      coinId: createdCoin.id,
      number: "123",
    })

    await expect(
      deleteCatalogue({
        id: createdCatalogue.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_reference_catalogue_id_catalogue_id_fk",
      }),
    })
  })
})
