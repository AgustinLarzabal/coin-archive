import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createShape as createShapeFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createShape,
  createShapeIdempotently,
  createShapeIdempotentlyWithDatabase,
  deleteShape,
  deleteShapeIfVersionWithDatabase,
  replaceShapeWithDatabase,
  updateShape,
} from "./shape"

describe("shape mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Shape Code and Shape Name before creating a Shape", async () => {
    await expect(
      createShape({
        code: "  reeded  ",
        name: "  Reeded  ",
      })
    ).resolves.toMatchObject({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("rejects duplicate Shape Codes after normalization", async () => {
    await createShapeFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      createShape({
        code: " reeded ",
        name: "Duplicate Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "shape_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Shape Codes instead of silently normalizing them", async () => {
    await expect(
      createShape({
        code: "Reeded",
        name: "Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "shape_code_slug_check",
      }),
    })
  })

  it("allows duplicate Shape Names when Shape Codes differ", async () => {
    const firstShape = await createShape({
      code: "reeded",
      name: "Reeded",
    })
    const secondShape = await createShape({
      code: "reeded-variant",
      name: "Reeded",
    })

    expect(firstShape.name).toBe(secondShape.name)
    expect(firstShape.id).not.toBe(secondShape.id)
  })

  it("persists and replays an identical idempotent Shape create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "shape-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " reeded ", name: " Reeded " },
    }
    const first = await createShapeIdempotently(input)
    const retry = await createShapeIdempotently(input)
    expect(first).toMatchObject({
      status: "created",
      shape: { code: "reeded", name: "Reeded", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      shape: first.status === "created" ? first.shape : expect.anything(),
    })
    await expect(db.query.shape.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Shape create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "shape-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    }
    await createShapeIdempotently(input)
    await expect(
      createShapeIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "plain", name: "Plain" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.shape.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Shape versions for replacement and deletion", async () => {
    const created = await createShapeIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "shape-request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    })
    if (created.status !== "created") throw new Error("Expected create")
    await expect(
      replaceShapeWithDatabase(db, {
        id: created.shape.id,
        expectedVersion: 1,
        code: " plain ",
        name: " Plain ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      shape: { version: 2, code: "plain", name: "Plain" },
    })
    await expect(
      replaceShapeWithDatabase(db, {
        id: created.shape.id,
        expectedVersion: 1,
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteShapeIfVersionWithDatabase(db, {
        id: created.shape.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteShapeIfVersionWithDatabase(db, {
        id: created.shape.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Shape constraints through versioned API mutations", async () => {
    const first = await createShapeFixture({ code: "reeded", name: "Reeded" })
    const second = await createShapeFixture({ code: "plain", name: "Plain" })

    await expect(
      replaceShapeWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "reeded",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "shape_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-shape-delete-issuer",
      name: "Versioned Shape Delete Issuer",
    })
    await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      shapeId: first.id,
      title: "Versioned Shape Delete Coin",
    })

    await expect(
      deleteShapeIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_shape_id_shape_id_fk",
      }),
    })
  })

  it("trims Shape Code and Shape Name before updating a Shape", async () => {
    const existingShape = await createShapeFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      updateShape({
        id: existingShape.id,
        code: "  lettered  ",
        name: "  Lettered  ",
      })
    ).resolves.toMatchObject({
      id: existingShape.id,
      code: "lettered",
      name: "Lettered",
    })
  })

  it("returns null when the Shape update target no longer exists", async () => {
    await expect(
      updateShape({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Shape Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-shape-update",
      name: "Issuer for Shape Update",
    })
    const createdShape = await createShape({
      code: "reeded",
      name: "Reeded",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      shapeId: createdShape.id,
      title: "Shape-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedShape = await updateShape({
      id: createdShape.id,
      code: "lettered",
      name: "Lettered",
    })

    expect(updatedShape).toMatchObject({
      id: createdShape.id,
      code: "lettered",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.shapeId).toBe(createdShape.id)
  })

  it("returns null when deleting a missing Shape", async () => {
    await expect(
      deleteShape({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Shape", async () => {
    const existingShape = await createShapeFixture({
      code: "obsolete-shape",
      name: "Obsolete Shape",
    })

    await expect(
      deleteShape({
        id: existingShape.id,
      })
    ).resolves.toMatchObject({
      id: existingShape.id,
      code: "obsolete-shape",
    })
  })

  it("rejects deleting a Shape while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-shape-delete",
      name: "Issuer for Shape Delete",
    })
    const existingShape = await createShapeFixture({
      code: "in-use-shape",
      name: "In Use Shape",
    })

    await createCoin({
      issuerId: issuer.id,
      shapeId: existingShape.id,
      title: "Shape Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteShape({
        id: existingShape.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_shape_id_shape_id_fk",
      }),
    })
  })
})
