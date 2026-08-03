import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createTechnique as createTechniqueFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createTechnique,
  createTechniqueIdempotently,
  createTechniqueIdempotentlyWithDatabase,
  deleteTechnique,
  deleteTechniqueIfVersionWithDatabase,
  replaceTechniqueWithDatabase,
  updateTechnique,
} from "./technique"

describe("technique mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Technique Code and Technique Name before creating a Technique", async () => {
    await expect(
      createTechnique({
        code: "  reeded  ",
        name: "  Reeded  ",
      })
    ).resolves.toMatchObject({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("rejects duplicate Technique Codes after normalization", async () => {
    await createTechniqueFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      createTechnique({
        code: " reeded ",
        name: "Duplicate Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "technique_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Technique Codes instead of silently normalizing them", async () => {
    await expect(
      createTechnique({
        code: "Reeded",
        name: "Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "technique_code_slug_check",
      }),
    })
  })

  it("allows duplicate Technique Names when Technique Codes differ", async () => {
    const firstTechnique = await createTechnique({
      code: "reeded",
      name: "Reeded",
    })
    const secondTechnique = await createTechnique({
      code: "reeded-variant",
      name: "Reeded",
    })

    expect(firstTechnique.name).toBe(secondTechnique.name)
    expect(firstTechnique.id).not.toBe(secondTechnique.id)
  })

  it("persists and replays an identical idempotent Technique create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "technique-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " reeded ", name: " Reeded " },
    }
    const first = await createTechniqueIdempotently(input)
    const retry = await createTechniqueIdempotently(input)
    expect(first).toMatchObject({
      status: "created",
      technique: { code: "reeded", name: "Reeded", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      technique:
        first.status === "created" ? first.technique : expect.anything(),
    })
    await expect(db.query.technique.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Technique create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "technique-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    }
    await createTechniqueIdempotently(input)
    await expect(
      createTechniqueIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "plain", name: "Plain" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.technique.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Technique versions for replacement and deletion", async () => {
    const created = await createTechniqueIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "technique-request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    })
    if (created.status !== "created") throw new Error("Expected create")
    await expect(
      replaceTechniqueWithDatabase(db, {
        id: created.technique.id,
        expectedVersion: 1,
        code: " plain ",
        name: " Plain ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      technique: { version: 2, code: "plain", name: "Plain" },
    })
    await expect(
      replaceTechniqueWithDatabase(db, {
        id: created.technique.id,
        expectedVersion: 1,
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteTechniqueIfVersionWithDatabase(db, {
        id: created.technique.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteTechniqueIfVersionWithDatabase(db, {
        id: created.technique.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Technique constraints through versioned API mutations", async () => {
    const first = await createTechniqueFixture({
      code: "reeded",
      name: "Reeded",
    })
    const second = await createTechniqueFixture({
      code: "plain",
      name: "Plain",
    })

    await expect(
      replaceTechniqueWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "reeded",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "technique_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-technique-delete-issuer",
      name: "Versioned Technique Delete Issuer",
    })
    await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      techniqueId: first.id,
      title: "Versioned Technique Delete Coin",
    })

    await expect(
      deleteTechniqueIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_technique_id_technique_id_fk",
      }),
    })
  })

  it("trims Technique Code and Technique Name before updating a Technique", async () => {
    const existingTechnique = await createTechniqueFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      updateTechnique({
        id: existingTechnique.id,
        code: "  lettered  ",
        name: "  Lettered  ",
      })
    ).resolves.toMatchObject({
      id: existingTechnique.id,
      code: "lettered",
      name: "Lettered",
    })
  })

  it("returns null when the Technique update target no longer exists", async () => {
    await expect(
      updateTechnique({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Technique Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-technique-update",
      name: "Issuer for Technique Update",
    })
    const createdTechnique = await createTechnique({
      code: "reeded",
      name: "Reeded",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      techniqueId: createdTechnique.id,
      title: "Technique-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedTechnique = await updateTechnique({
      id: createdTechnique.id,
      code: "lettered",
      name: "Lettered",
    })

    expect(updatedTechnique).toMatchObject({
      id: createdTechnique.id,
      code: "lettered",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.techniqueId).toBe(createdTechnique.id)
  })

  it("returns null when deleting a missing Technique", async () => {
    await expect(
      deleteTechnique({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Technique", async () => {
    const existingTechnique = await createTechniqueFixture({
      code: "obsolete-technique",
      name: "Obsolete Technique",
    })

    await expect(
      deleteTechnique({
        id: existingTechnique.id,
      })
    ).resolves.toMatchObject({
      id: existingTechnique.id,
      code: "obsolete-technique",
    })
  })

  it("rejects deleting a Technique while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-technique-delete",
      name: "Issuer for Technique Delete",
    })
    const existingTechnique = await createTechniqueFixture({
      code: "in-use-technique",
      name: "In Use Technique",
    })

    await createCoin({
      issuerId: issuer.id,
      techniqueId: existingTechnique.id,
      title: "Technique Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteTechnique({
        id: existingTechnique.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_technique_id_technique_id_fk",
      }),
    })
  })
})
