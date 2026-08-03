import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createRim as createRimFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createRim,
  createRimIdempotently,
  createRimIdempotentlyWithDatabase,
  deleteRim,
  deleteRimIfVersionWithDatabase,
  replaceRimWithDatabase,
  updateRim,
} from "./rim"

describe("rim mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Rim Code and Rim Name before creating a Rim", async () => {
    await expect(
      createRim({
        code: "  reeded  ",
        name: "  Reeded  ",
      })
    ).resolves.toMatchObject({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("rejects duplicate Rim Codes after normalization", async () => {
    await createRimFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      createRim({
        code: " reeded ",
        name: "Duplicate Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "rim_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Rim Codes instead of silently normalizing them", async () => {
    await expect(
      createRim({
        code: "Reeded",
        name: "Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "rim_code_slug_check",
      }),
    })
  })

  it("allows duplicate Rim Names when Rim Codes differ", async () => {
    const firstRim = await createRim({
      code: "reeded",
      name: "Reeded",
    })
    const secondRim = await createRim({
      code: "reeded-variant",
      name: "Reeded",
    })

    expect(firstRim.name).toBe(secondRim.name)
    expect(firstRim.id).not.toBe(secondRim.id)
  })

  it("persists and replays an identical idempotent Rim create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "rim-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " reeded ", name: " Reeded " },
    }
    const first = await createRimIdempotently(input)
    const retry = await createRimIdempotently(input)
    expect(first).toMatchObject({
      status: "created",
      rim: { code: "reeded", name: "Reeded", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      rim: first.status === "created" ? first.rim : expect.anything(),
    })
    await expect(db.query.rim.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Rim create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "rim-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    }
    await createRimIdempotently(input)
    await expect(
      createRimIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "plain", name: "Plain" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.rim.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Rim versions for replacement and deletion", async () => {
    const created = await createRimIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    })
    if (created.status !== "created") throw new Error("Expected create")
    await expect(
      replaceRimWithDatabase(db, {
        id: created.rim.id,
        expectedVersion: 1,
        code: " plain ",
        name: " Plain ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      rim: { version: 2, code: "plain", name: "Plain" },
    })
    await expect(
      replaceRimWithDatabase(db, {
        id: created.rim.id,
        expectedVersion: 1,
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteRimIfVersionWithDatabase(db, {
        id: created.rim.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteRimIfVersionWithDatabase(db, {
        id: created.rim.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Rim constraints through versioned API mutations", async () => {
    const first = await createRimFixture({ code: "reeded", name: "Reeded" })
    const second = await createRimFixture({ code: "plain", name: "Plain" })

    await expect(
      replaceRimWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "reeded",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "rim_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-rim-delete-issuer",
      name: "Versioned Rim Delete Issuer",
    })
    await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      rimId: first.id,
      title: "Versioned Rim Delete Coin",
    })

    await expect(
      deleteRimIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_rim_id_rim_id_fk",
      }),
    })
  })

  it("trims Rim Code and Rim Name before updating a Rim", async () => {
    const existingRim = await createRimFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      updateRim({
        id: existingRim.id,
        code: "  lettered  ",
        name: "  Lettered  ",
      })
    ).resolves.toMatchObject({
      id: existingRim.id,
      code: "lettered",
      name: "Lettered",
    })
  })

  it("returns null when the Rim update target no longer exists", async () => {
    await expect(
      updateRim({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Rim Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-rim-update",
      name: "Issuer for Rim Update",
    })
    const createdRim = await createRim({
      code: "reeded",
      name: "Reeded",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      rimId: createdRim.id,
      title: "Rim-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedRim = await updateRim({
      id: createdRim.id,
      code: "lettered",
      name: "Lettered",
    })

    expect(updatedRim).toMatchObject({
      id: createdRim.id,
      code: "lettered",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.rimId).toBe(createdRim.id)
  })

  it("returns null when deleting a missing Rim", async () => {
    await expect(
      deleteRim({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Rim", async () => {
    const existingRim = await createRimFixture({
      code: "obsolete-rim",
      name: "Obsolete Rim",
    })

    await expect(
      deleteRim({
        id: existingRim.id,
      })
    ).resolves.toMatchObject({
      id: existingRim.id,
      code: "obsolete-rim",
    })
  })

  it("rejects deleting a Rim while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-rim-delete",
      name: "Issuer for Rim Delete",
    })
    const existingRim = await createRimFixture({
      code: "in-use-rim",
      name: "In Use Rim",
    })

    await createCoin({
      issuerId: issuer.id,
      rimId: existingRim.id,
      title: "Rim Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteRim({
        id: existingRim.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_rim_id_rim_id_fk",
      }),
    })
  })
})
