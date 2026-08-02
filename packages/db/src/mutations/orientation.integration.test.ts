import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createIssuer,
  createOrientation as createOrientationFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createOrientation,
  createOrientationIdempotently,
  createOrientationIdempotentlyWithDatabase,
  deleteOrientation,
  deleteOrientationIfVersion,
  deleteOrientationIfVersionWithDatabase,
  replaceOrientation,
  replaceOrientationWithDatabase,
  updateOrientation,
} from "./orientation"

describe("orientation mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Orientation Code and Orientation Name before creating an Orientation", async () => {
    await expect(
      createOrientation({
        code: "  coin-alignment  ",
        name: "  Coin alignment  ",
      })
    ).resolves.toMatchObject({
      code: "coin-alignment",
      name: "Coin alignment",
      version: 1,
    })
  })

  it("rejects duplicate Orientation Codes after normalization", async () => {
    await createOrientationFixture({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expect(
      createOrientation({
        code: " coin-alignment ",
        name: "Duplicate Coin alignment",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "orientation_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Orientation Codes instead of silently normalizing them", async () => {
    await expect(
      createOrientation({
        code: "Coin-Alignment",
        name: "Coin alignment",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "orientation_code_slug_check",
      }),
    })
  })

  it("allows duplicate Orientation Names when Orientation Codes differ", async () => {
    const firstOrientation = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const secondOrientation = await createOrientation({
      code: "medal-alignment",
      name: "Coin alignment",
    })

    expect(firstOrientation.name).toBe(secondOrientation.name)
    expect(firstOrientation.id).not.toBe(secondOrientation.id)
  })

  it("persists and replays an identical idempotent create response", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "orientation-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2026-08-03T00:00:00.000Z"),
      fields: { code: "coin-alignment", name: "Coin alignment" },
    }

    const first = await createOrientationIdempotently(input)
    const retry = await createOrientationIdempotently(input)

    expect(first).toMatchObject({ status: "created" })
    expect(retry).toStrictEqual({
      status: "replayed",
      orientation:
        first.status === "created" ? first.orientation : expect.anything(),
    })
    await expect(db.query.orientation.findMany()).resolves.toHaveLength(1)
  })

  it("supports request-scoped database clients for API mutations", async () => {
    const created = await createOrientationIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      fields: { code: "coin-alignment", name: "Coin alignment" },
    })
    if (created.status !== "created") throw new Error("Expected create")

    const replaced = await replaceOrientationWithDatabase(db, {
      id: created.orientation.id,
      expectedVersion: 1,
      code: "medal-alignment",
      name: "Medal alignment",
    })
    expect(replaced).toMatchObject({ status: "updated" })

    await expect(
      deleteOrientationIfVersionWithDatabase(db, {
        id: created.orientation.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("rejects payload-mismatched reuse of an Orientation create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "orientation-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2026-08-03T00:00:00.000Z"),
      fields: { code: "coin-alignment", name: "Coin alignment" },
    }
    await createOrientationIdempotently(input)

    await expect(
      createOrientationIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "medal-alignment", name: "Medal alignment" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.orientation.findMany()).resolves.toHaveLength(1)
  })

  it("creates only one Orientation when identical requests race", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "concurrent-orientation-attempt",
      requestHash: "c".repeat(64),
      expiresAt: new Date("2026-08-03T00:00:00.000Z"),
      fields: { code: "coin-alignment", name: "Coin alignment" },
    }

    const results = await Promise.all([
      createOrientationIdempotently(input),
      createOrientationIdempotently(input),
    ])

    expect(results.map((result) => result.status).sort()).toStrictEqual([
      "created",
      "replayed",
    ])
    await expect(db.query.orientation.findMany()).resolves.toHaveLength(1)
  })

  it("allows an expired idempotency key to begin a new create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "expired-orientation-attempt",
      requestHash: "d".repeat(64),
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      fields: { code: "coin-alignment", name: "Coin alignment" },
    }
    await createOrientationIdempotently(input)

    await expect(
      createOrientationIdempotently({
        ...input,
        requestHash: "e".repeat(64),
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        fields: { code: "medal-alignment", name: "Medal alignment" },
      })
    ).resolves.toMatchObject({ status: "created" })
    await expect(db.query.orientation.findMany()).resolves.toHaveLength(2)
  })

  it("cleans all expired idempotency records when processing a create", async () => {
    await createOrientationIdempotently({
      collectorId: "collector-1",
      idempotencyKey: "expired-unrelated-key",
      requestHash: "1".repeat(64),
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      fields: { code: "coin-alignment", name: "Coin alignment" },
    })
    await createOrientationIdempotently({
      collectorId: "collector-2",
      idempotencyKey: "current-key",
      requestHash: "2".repeat(64),
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      fields: { code: "medal-alignment", name: "Medal alignment" },
    })

    await expect(
      db.query.maintenanceIdempotency.findMany()
    ).resolves.toMatchObject([
      { collectorId: "collector-2", key: "current-key" },
    ])
  })

  it("trims Orientation Code and Orientation Name before updating an Orientation", async () => {
    const existingOrientation = await createOrientationFixture({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expect(
      updateOrientation({
        id: existingOrientation.id,
        code: "  medal-alignment  ",
        name: "  Medal alignment  ",
      })
    ).resolves.toMatchObject({
      id: existingOrientation.id,
      code: "medal-alignment",
      name: "Medal alignment",
      version: 2,
    })
  })

  it("atomically replaces only the expected Orientation version", async () => {
    const existing = await createOrientationFixture({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expect(
      replaceOrientation({
        id: existing.id,
        expectedVersion: 1,
        code: "medal-alignment",
        name: "Medal alignment",
      })
    ).resolves.toMatchObject({
      status: "updated",
      orientation: { version: 2, code: "medal-alignment" },
    })
    await expect(
      replaceOrientation({
        id: existing.id,
        expectedVersion: 1,
        code: "coin-alignment",
        name: "Coin alignment",
      })
    ).resolves.toStrictEqual({ status: "stale" })
  })

  it("returns null when the Orientation update target no longer exists", async () => {
    await expect(
      updateOrientation({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "coin-alignment",
        name: "Coin alignment",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when an Orientation Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-orientation-update",
      name: "Issuer for Orientation Update",
    })
    const createdOrientation = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      orientationId: createdOrientation.id,
      title: "Orientation-linked coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    const updatedOrientation = await updateOrientation({
      id: createdOrientation.id,
      code: "medal-alignment",
      name: "Medal alignment",
    })

    expect(updatedOrientation).toMatchObject({
      id: createdOrientation.id,
      code: "medal-alignment",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.orientationId).toBe(createdOrientation.id)
  })

  it("returns null when deleting a missing Orientation", async () => {
    await expect(
      deleteOrientation({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Orientation", async () => {
    const existingOrientation = await createOrientationFixture({
      code: "obsolete-orientation",
      name: "Obsolete Orientation",
    })

    await expect(
      deleteOrientation({
        id: existingOrientation.id,
      })
    ).resolves.toMatchObject({
      id: existingOrientation.id,
      code: "obsolete-orientation",
    })
  })

  it("atomically deletes only the expected Orientation version", async () => {
    const existing = await createOrientationFixture({
      code: "obsolete-orientation",
      name: "Obsolete Orientation",
    })

    await expect(
      deleteOrientationIfVersion({ id: existing.id, expectedVersion: 2 })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteOrientationIfVersion({ id: existing.id, expectedVersion: 1 })
    ).resolves.toMatchObject({ status: "deleted" })
    await expect(
      deleteOrientationIfVersion({ id: existing.id, expectedVersion: 1 })
    ).resolves.toStrictEqual({ status: "missing" })
  })

  it("rejects deleting an Orientation while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-orientation-delete",
      name: "Issuer for Orientation Delete",
    })
    const existingOrientation = await createOrientationFixture({
      code: "in-use-orientation",
      name: "In Use Orientation",
    })

    await createCoin({
      issuerId: issuer.id,
      orientationId: existingOrientation.id,
      title: "Orientation Restrict Delete Coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await expect(
      deleteOrientation({
        id: existingOrientation.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_orientation_id_orientation_id_fk",
      }),
    })
  })
})
