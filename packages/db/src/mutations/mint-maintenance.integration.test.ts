import { describe, expect, it } from "vitest"

import { db } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createMintIdempotently,
  createMintIdempotentlyWithDatabase,
  deleteMintIfVersionWithDatabase,
  replaceMintWithDatabase,
} from "./mint"

describe("Mint maintenance mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("persists and replays an identical idempotent Mint create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "mint-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " madrid ", name: " Madrid " },
    }
    const first = await createMintIdempotently(input)
    const retry = await createMintIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      mint: { code: "madrid", name: "Madrid", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      mint: first.status === "created" ? first.mint : expect.anything(),
    })
    await expect(db.query.mint.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Mint create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "mint-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "madrid", name: "Madrid" },
    }
    await createMintIdempotently(input)

    await expect(
      createMintIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "london", name: "London" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.mint.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Mint versions for replacement and deletion", async () => {
    const created = await createMintIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "mint-request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "madrid", name: "Madrid" },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceMintWithDatabase(db, {
        id: created.mint.id,
        expectedVersion: 1,
        code: " london ",
        name: " London ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      mint: { version: 2, code: "london", name: "London" },
    })
    await expect(
      replaceMintWithDatabase(db, {
        id: created.mint.id,
        expectedVersion: 1,
        code: "madrid",
        name: "Madrid",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteMintIfVersionWithDatabase(db, {
        id: created.mint.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteMintIfVersionWithDatabase(db, {
        id: created.mint.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })
})
