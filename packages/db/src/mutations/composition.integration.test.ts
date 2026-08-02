import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createComposition as createCompositionFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createComposition,
  createCompositionIdempotently,
  createCompositionIdempotentlyWithDatabase,
  deleteComposition,
  deleteCompositionIfVersionWithDatabase,
  replaceCompositionWithDatabase,
  updateComposition,
} from "./composition"

describe("composition mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Composition Code and Composition Name before creating a Composition", async () => {
    await expect(
      createComposition({
        code: "  silver-900  ",
        name: "  Silver (.900)  ",
      })
    ).resolves.toMatchObject({
      code: "silver-900",
      name: "Silver (.900)",
    })
  })

  it("rejects duplicate Composition Codes after normalization", async () => {
    await createCompositionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    await expect(
      createComposition({
        code: " silver-900 ",
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

  it("persists and replays an identical idempotent Composition create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "composition-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " silver ", name: " Silver " },
    }

    const first = await createCompositionIdempotently(input)
    const retry = await createCompositionIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      composition: { code: "silver", name: "Silver", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      composition:
        first.status === "created" ? first.composition : expect.anything(),
    })
    await expect(db.query.composition.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Composition create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "composition-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "silver", name: "Silver" },
    }
    await createCompositionIdempotently(input)

    await expect(
      createCompositionIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "gold", name: "Gold" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.composition.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Composition versions for replacement and deletion", async () => {
    const created = await createCompositionIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "silver", name: "Silver" },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceCompositionWithDatabase(db, {
        id: created.composition.id,
        expectedVersion: 1,
        code: " gold ",
        name: " Gold ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      composition: { version: 2, code: "gold", name: "Gold" },
    })
    await expect(
      replaceCompositionWithDatabase(db, {
        id: created.composition.id,
        expectedVersion: 1,
        code: "silver",
        name: "Silver",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteCompositionIfVersionWithDatabase(db, {
        id: created.composition.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteCompositionIfVersionWithDatabase(db, {
        id: created.composition.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Composition constraints through versioned API mutations", async () => {
    const first = await createCompositionFixture({
      code: "silver",
      name: "Silver",
    })
    const second = await createCompositionFixture({
      code: "gold",
      name: "Gold",
    })

    await expect(
      replaceCompositionWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "silver",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "composition_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-composition-delete-issuer",
      name: "Versioned Composition Delete Issuer",
    })
    await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      compositionId: first.id,
      title: "Versioned Composition Delete Coin",
    })

    await expect(
      deleteCompositionIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_composition_id_composition_id_fk",
      }),
    })
  })

  it("trims Composition fields and updates updatedAt when updating a Composition", async () => {
    const existingComposition = await createCompositionFixture({
      code: "silver-900",
      name: "Silver (.900)",
    })

    const updatedComposition = await updateComposition({
      id: existingComposition.id,
      code: " silver-925 ",
      name: " Silver (.925) ",
    })

    expect(updatedComposition).toMatchObject({
      id: existingComposition.id,
      code: "silver-925",
      name: "Silver (.925)",
    })
    expect(updatedComposition?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      existingComposition.updatedAt.getTime()
    )
  })

  it("returns null when the Composition update target no longer exists", async () => {
    await expect(
      updateComposition({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "silver-900",
        name: "Silver (.900)",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Composition Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-composition-update",
      name: "Issuer for Composition Update",
    })
    const createdComposition = await createComposition({
      code: "silver-900",
      name: "Silver (.900)",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      compositionId: createdComposition.id,
      title: "Composition-linked coin",
      createdAt: new Date("2026-06-25T12:00:00.000Z"),
    })

    const updatedComposition = await updateComposition({
      id: createdComposition.id,
      code: "silver-925",
      name: "Silver (.925)",
    })

    expect(updatedComposition).toMatchObject({
      id: createdComposition.id,
      code: "silver-925",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.compositionId).toBe(createdComposition.id)
  })

  it("returns null when deleting a missing Composition", async () => {
    await expect(
      deleteComposition({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Composition", async () => {
    const existingComposition = await createCompositionFixture({
      code: "billon",
      name: "Billon",
    })

    await expect(
      deleteComposition({
        id: existingComposition.id,
      })
    ).resolves.toMatchObject({
      id: existingComposition.id,
      code: "billon",
    })
  })

  it("rejects deleting a Composition while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "test-issuer",
      name: "Test Issuer",
    })
    const existingComposition = await createCompositionFixture({
      code: "in-use-composition",
      name: "In Use Composition",
    })

    await createCoin({
      issuerId: issuer.id,
      compositionId: existingComposition.id,
      title: "Composition Restrict Delete Coin",
      createdAt: new Date("2026-06-25T00:00:00.000Z"),
    })

    await expect(
      deleteComposition({
        id: existingComposition.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_composition_id_composition_id_fk",
      }),
    })
  })
})
