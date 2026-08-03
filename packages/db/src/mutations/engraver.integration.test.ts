import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCoinSurface,
  createCoinSurfaceEngraver,
  createEngraver as createEngraverFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createEngraver,
  createEngraverIdempotently,
  createEngraverIdempotentlyWithDatabase,
  deleteEngraver,
  deleteEngraverIfVersionWithDatabase,
  replaceEngraverWithDatabase,
  updateEngraver,
} from "./engraver"

describe("engraver mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Engraver Code and Engraver Name before creating an Engraver", async () => {
    await expect(
      createEngraver({
        code: "  reeded  ",
        name: "  Reeded  ",
      })
    ).resolves.toMatchObject({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("rejects duplicate Engraver Codes after normalization", async () => {
    await createEngraverFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      createEngraver({
        code: " reeded ",
        name: "Duplicate Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "engraver_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Engraver Codes instead of silently normalizing them", async () => {
    await expect(
      createEngraver({
        code: "Reeded",
        name: "Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "engraver_code_slug_check",
      }),
    })
  })

  it("allows duplicate Engraver Names when Engraver Codes differ", async () => {
    const firstEngraver = await createEngraver({
      code: "reeded",
      name: "Reeded",
    })
    const secondEngraver = await createEngraver({
      code: "reeded-variant",
      name: "Reeded",
    })

    expect(firstEngraver.name).toBe(secondEngraver.name)
    expect(firstEngraver.id).not.toBe(secondEngraver.id)
  })

  it("persists and replays an identical idempotent Engraver create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "engraver-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " reeded ", name: " Reeded " },
    }
    const first = await createEngraverIdempotently(input)
    const retry = await createEngraverIdempotently(input)
    expect(first).toMatchObject({
      status: "created",
      engraver: { code: "reeded", name: "Reeded", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      engraver: first.status === "created" ? first.engraver : expect.anything(),
    })
    await expect(db.query.engraver.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of an Engraver create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "engraver-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    }
    await createEngraverIdempotently(input)
    await expect(
      createEngraverIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "plain", name: "Plain" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.engraver.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Engraver versions for replacement and deletion", async () => {
    const created = await createEngraverIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "engraver-request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    })
    if (created.status !== "created") throw new Error("Expected create")
    await expect(
      replaceEngraverWithDatabase(db, {
        id: created.engraver.id,
        expectedVersion: 1,
        code: " plain ",
        name: " Plain ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      engraver: { version: 2, code: "plain", name: "Plain" },
    })
    await expect(
      replaceEngraverWithDatabase(db, {
        id: created.engraver.id,
        expectedVersion: 1,
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteEngraverIfVersionWithDatabase(db, {
        id: created.engraver.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteEngraverIfVersionWithDatabase(db, {
        id: created.engraver.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Engraver constraints through versioned API mutations", async () => {
    const first = await createEngraverFixture({ code: "reeded", name: "Reeded" })
    const second = await createEngraverFixture({ code: "plain", name: "Plain" })

    await expect(
      replaceEngraverWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "reeded",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "engraver_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-engraver-delete-issuer",
      name: "Versioned Engraver Delete Issuer",
    })
    const coin = await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      title: "Versioned Engraver Delete Coin",
    })
    const obverse = await createCoinSurface({
      coinId: coin.id,
      kind: "obverse",
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverse.id,
      engraverId: first.id,
    })

    await expect(
      deleteEngraverIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_face_engraver_engraver_id_engraver_id_fk",
      }),
    })
  })

  it("trims Engraver Code and Engraver Name before updating an Engraver", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      updateEngraver({
        id: existingEngraver.id,
        code: "  lettered  ",
        name: "  Lettered  ",
      })
    ).resolves.toMatchObject({
      id: existingEngraver.id,
      code: "lettered",
      name: "Lettered",
    })
  })

  it("updates the Engraver timestamp in place", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })

    await new Promise((resolve) => setTimeout(resolve, 5))

    const updatedEngraver = await updateEngraver({
      id: existingEngraver.id,
      code: "durand",
      name: "Durand",
    })

    expect(updatedEngraver).toMatchObject({
      id: existingEngraver.id,
      createdAt: existingEngraver.createdAt,
    })
    expect(updatedEngraver?.updatedAt.getTime()).toBeGreaterThan(
      existingEngraver.updatedAt.getTime()
    )
  })

  it("rejects duplicate Engraver Codes during replacement", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })
    const conflictingEngraver = await createEngraverFixture({
      code: "durand",
      name: "Durand",
    })

    await expect(
      replaceEngraverWithDatabase(db, {
        id: conflictingEngraver.id,
        expectedVersion: 1,
        code: " barth ",
        name: "Updated Durand",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "engraver_code_lower_unique_idx",
      }),
    })
    expect(existingEngraver.code).toBe("barth")
  })

  it("rejects invalid Engraver Codes during replacement", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })

    await expect(
      replaceEngraverWithDatabase(db, {
        id: existingEngraver.id,
        expectedVersion: 1,
        code: "Barth",
        name: "Updated Barth",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "engraver_code_slug_check",
      }),
    })
  })

  it("returns null when the Engraver update target no longer exists", async () => {
    await expect(
      updateEngraver({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Engraver Attributions when an Engraver Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-engraver-update",
      name: "Issuer for Engraver Update",
    })
    const createdEngraver = await createEngraver({
      code: "reeded",
      name: "Reeded",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Engraver-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })
    const obverse = await createCoinSurface({
      coinId: createdCoin.id,
      kind: "obverse",
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverse.id,
      engraverId: createdEngraver.id,
    })

    const updatedEngraver = await updateEngraver({
      id: createdEngraver.id,
      code: "lettered",
      name: "Lettered",
    })

    expect(updatedEngraver).toMatchObject({
      id: createdEngraver.id,
      code: "lettered",
    })

    const persistedAttribution = await db.query.coinSurfaceEngraver.findFirst({
      where: (attribution, { and, eq }) =>
        and(
          eq(attribution.coinSurfaceId, obverse.id),
          eq(attribution.engraverId, createdEngraver.id)
        ),
    })

    expect(persistedAttribution).toBeDefined()
  })

  it("returns null when deleting a missing Engraver", async () => {
    await expect(
      deleteEngraver({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Engraver", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "obsolete-engraver",
      name: "Obsolete Engraver",
    })

    await expect(
      deleteEngraver({
        id: existingEngraver.id,
      })
    ).resolves.toMatchObject({
      id: existingEngraver.id,
      code: "obsolete-engraver",
    })
  })

  it("rejects deleting an Engraver while Engraver Attributions still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-engraver-delete",
      name: "Issuer for Engraver Delete",
    })
    const existingEngraver = await createEngraverFixture({
      code: "in-use-engraver",
      name: "In Use Engraver",
    })

    const coin = await createCoin({
      issuerId: issuer.id,
      title: "Engraver Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })
    const reverse = await createCoinSurface({
      coinId: coin.id,
      kind: "reverse",
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: reverse.id,
      engraverId: existingEngraver.id,
    })

    await expect(
      deleteEngraver({
        id: existingEngraver.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_face_engraver_engraver_id_engraver_id_fk",
      }),
    })
  })
})
