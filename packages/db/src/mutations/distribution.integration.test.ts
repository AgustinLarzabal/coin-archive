import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createDistribution as createDistributionFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createDistribution,
  createDistributionIdempotently,
  createDistributionIdempotentlyWithDatabase,
  deleteDistribution,
  deleteDistributionIfVersionWithDatabase,
  replaceDistributionWithDatabase,
  updateDistribution,
} from "./distribution"

describe("distribution mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Distribution Code and Distribution Name before creating a Distribution", async () => {
    await expect(
      createDistribution({
        code: "  silver-900  ",
        name: "  Silver (.900)  ",
      })
    ).resolves.toMatchObject({
      code: "silver-900",
      name: "Silver (.900)",
    })
  })

  it("rejects duplicate Distribution Codes after normalization", async () => {
    await createDistributionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    await expect(
      createDistribution({
        code: " silver-900 ",
        name: "Duplicate Silver (.900)",
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
        code: "Silver 900",
        name: "Silver (.900)",
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
      code: "silver-500",
      name: "Silver",
    })
    const secondDistribution = await createDistribution({
      code: "silver-925",
      name: "Silver",
    })

    expect(firstDistribution.name).toBe(secondDistribution.name)
    expect(firstDistribution.id).not.toBe(secondDistribution.id)
  })

  it("persists and replays an identical idempotent Distribution create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "distribution-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " silver ", name: " Silver " },
    }

    const first = await createDistributionIdempotently(input)
    const retry = await createDistributionIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      distribution: { code: "silver", name: "Silver", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      distribution:
        first.status === "created" ? first.distribution : expect.anything(),
    })
    await expect(db.query.distribution.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Distribution create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "distribution-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "silver", name: "Silver" },
    }
    await createDistributionIdempotently(input)

    await expect(
      createDistributionIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "gold", name: "Gold" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.distribution.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Distribution versions for replacement and deletion", async () => {
    const created = await createDistributionIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "silver", name: "Silver" },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceDistributionWithDatabase(db, {
        id: created.distribution.id,
        expectedVersion: 1,
        code: " gold ",
        name: " Gold ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      distribution: { version: 2, code: "gold", name: "Gold" },
    })
    await expect(
      replaceDistributionWithDatabase(db, {
        id: created.distribution.id,
        expectedVersion: 1,
        code: "silver",
        name: "Silver",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteDistributionIfVersionWithDatabase(db, {
        id: created.distribution.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteDistributionIfVersionWithDatabase(db, {
        id: created.distribution.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Distribution constraints through versioned API mutations", async () => {
    const first = await createDistributionFixture({
      code: "silver",
      name: "Silver",
    })
    const second = await createDistributionFixture({
      code: "gold",
      name: "Gold",
    })

    await expect(
      replaceDistributionWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "silver",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "distribution_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-distribution-delete-issuer",
      name: "Versioned Distribution Delete Issuer",
    })
    await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      distributionId: first.id,
      title: "Versioned Distribution Delete Coin",
    })

    await expect(
      deleteDistributionIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_distribution_id_distribution_id_fk",
      }),
    })
  })

  it("trims Distribution fields and updates updatedAt when updating a Distribution", async () => {
    const existingDistribution = await createDistributionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    const updatedDistribution = await updateDistribution({
      id: existingDistribution.id,
      code: " silver-925 ",
      name: " Silver (.925) ",
    })

    expect(updatedDistribution).toMatchObject({
      id: existingDistribution.id,
      code: "silver-925",
      name: "Silver (.925)",
    })
    expect(updatedDistribution?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      existingDistribution.updatedAt.getTime()
    )
  })

  it("returns null when the Distribution update target no longer exists", async () => {
    await expect(
      updateDistribution({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "silver-900",
        name: "Silver (.900)",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Distribution Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-distribution-update",
      name: "Issuer for Distribution Update",
    })
    const createdDistribution = await createDistribution({
      code: "silver-900",
      name: "Silver (.900)",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      distributionId: createdDistribution.id,
      title: "Distribution-linked coin",
      createdAt: new Date("2026-06-25T12:00:00.000Z"),
    })

    const updatedDistribution = await updateDistribution({
      id: createdDistribution.id,
      code: "silver-925",
      name: "Silver (.925)",
    })

    expect(updatedDistribution).toMatchObject({
      id: createdDistribution.id,
      code: "silver-925",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.distributionId).toBe(createdDistribution.id)
  })

  it("returns null when deleting a missing Distribution", async () => {
    await expect(
      deleteDistribution({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Distribution", async () => {
    const existingDistribution = await createDistributionFixture({
      code: "billon",
      name: "Billon",
    })

    await expect(
      deleteDistribution({
        id: existingDistribution.id,
      })
    ).resolves.toMatchObject({
      id: existingDistribution.id,
      code: "billon",
    })
  })

  it("rejects deleting a Distribution while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "test-issuer",
      name: "Test Issuer",
    })
    const existingDistribution = await createDistributionFixture({
      code: "in-use-distribution",
      name: "In Use Distribution",
    })

    await createCoin({
      issuerId: issuer.id,
      distributionId: existingDistribution.id,
      title: "Distribution Restrict Delete Coin",
      createdAt: new Date("2026-06-25T00:00:00.000Z"),
    })

    await expect(
      deleteDistribution({
        id: existingDistribution.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_distribution_id_distribution_id_fk",
      }),
    })
  })
})
