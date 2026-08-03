import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCoinRuler,
  createIssuer,
  createRuler as createRulerFixture,
  createRulerGroup,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createRuler,
  createRulerIdempotently,
  createRulerIdempotentlyWithDatabase,
  deleteRuler,
  deleteRulerIfVersionWithDatabase,
  replaceRulerWithDatabase,
  updateRuler,
} from "./ruler"
import { updateRulerGroup } from "./ruler-group"

describe("ruler mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Ruler fields and preserves an optional Ruler Group assignment when creating a Ruler", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await expect(
      createRuler({
        code: "  felipe-v  ",
        name: "  Felipe V  ",
        rulerGroupId: bourbon.id,
      })
    ).resolves.toMatchObject({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: bourbon.id,
    })
  })

  it("rejects duplicate Ruler Codes after normalization", async () => {
    await createRulerFixture({
      code: "felipe-v",
      name: "Felipe V",
    })

    await expect(
      createRuler({
        code: " felipe-v ",
        name: "Duplicate Felipe V",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "ruler_code_unique_idx",
      }),
    })
  })

  it("rejects invalid Ruler Codes instead of silently normalizing them", async () => {
    await expect(
      createRuler({
        code: "Felipe-V",
        name: "Felipe V",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "ruler_code_slug_check",
      }),
    })
  })

  it("allows duplicate Ruler Names when Ruler Codes differ", async () => {
    const firstRuler = await createRuler({
      code: "felipe-v",
      name: "Felipe",
    })
    const secondRuler = await createRuler({
      code: "felipe-vi",
      name: "Felipe",
    })

    expect(firstRuler.name).toBe(secondRuler.name)
    expect(firstRuler.id).not.toBe(secondRuler.id)
  })

  it("replays identical idempotent Ruler creation and rejects changed payloads", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon-replay",
      name: "House of Bourbon",
    })
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "ruler-create-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: {
        code: " felipe-v ",
        name: " Felipe V ",
        rulerGroupId: bourbon.id,
      },
    }
    const first = await createRulerIdempotently(input)
    await updateRulerGroup({
      id: bourbon.id,
      code: bourbon.code,
      name: "House of Bourbon Updated",
    })
    const retry = await createRulerIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      ruler: {
        code: "felipe-v",
        version: 1,
        group: { id: bourbon.id, name: "House of Bourbon" },
      },
    })
    expect(retry).toMatchObject({
      status: "replayed",
      ruler: { group: { id: bourbon.id, name: "House of Bourbon" } },
    })
    await expect(
      createRulerIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "carlos-ii", name: "Carlos II", rulerGroupId: null },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.ruler.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Ruler versions and optional Ruler Group replacement", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const created = await createRulerIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "versioned-ruler-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "felipe-v", name: "Felipe V", rulerGroupId: null },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceRulerWithDatabase(db, {
        id: created.ruler.id,
        expectedVersion: 1,
        code: " felipe-v-bourbon ",
        name: " Felipe V ",
        rulerGroupId: bourbon.id,
      })
    ).resolves.toMatchObject({
      status: "updated",
      ruler: {
        code: "felipe-v-bourbon",
        rulerGroupId: bourbon.id,
        version: 2,
      },
    })
    await expect(
      replaceRulerWithDatabase(db, {
        id: created.ruler.id,
        expectedVersion: 1,
        code: "felipe-v",
        name: "Felipe V",
        rulerGroupId: null,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteRulerIfVersionWithDatabase(db, {
        id: created.ruler.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteRulerIfVersionWithDatabase(db, {
        id: created.ruler.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves the Coin Ruler Attribution conflict for versioned deletion", async () => {
    const issuer = await createIssuer({
      code: "issuer-conflict",
      name: "Issuer",
    })
    const existingRuler = await createRulerFixture({
      code: "in-use-ruler-versioned",
      name: "In Use Ruler",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Versioned delete conflict",
      createdAt: new Date("2026-08-03T00:00:00.000Z"),
    })
    await createCoinRuler({
      coinId: createdCoin.id,
      rulerId: existingRuler.id,
      rulerOrder: 1,
    })

    await expect(
      deleteRulerIfVersionWithDatabase(db, {
        id: existingRuler.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_ruler_ruler_id_ruler_id_fk",
      }),
    })
  })

  it("trims Ruler fields and can change the optional Ruler Group assignment during update", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const habsburg = await createRulerGroup({
      code: "house-of-habsburg",
      name: "House of Habsburg",
    })
    const existingRuler = await createRulerFixture({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: bourbon.id,
    })

    await expect(
      updateRuler({
        id: existingRuler.id,
        code: "  carlos-ii  ",
        name: "  Carlos II  ",
        rulerGroupId: habsburg.id,
      })
    ).resolves.toMatchObject({
      id: existingRuler.id,
      code: "carlos-ii",
      name: "Carlos II",
      rulerGroupId: habsburg.id,
    })
  })

  it("clears an existing Ruler Group assignment during update", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const existingRuler = await createRulerFixture({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: bourbon.id,
    })

    await expect(
      updateRuler({
        id: existingRuler.id,
        code: "felipe-v",
        name: "Felipe V",
        rulerGroupId: null,
      })
    ).resolves.toMatchObject({
      id: existingRuler.id,
      rulerGroupId: null,
    })
  })

  it("returns null when the Ruler update target no longer exists", async () => {
    await expect(
      updateRuler({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "felipe-v",
        name: "Felipe V",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin Ruler Attributions when a Ruler Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-ruler-update",
      name: "Issuer for Ruler Update",
    })
    const existingRuler = await createRuler({
      code: "felipe-v",
      name: "Felipe V",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Ruler-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: createdCoin.id,
      rulerId: existingRuler.id,
      rulerOrder: 1,
    })

    const updatedRuler = await updateRuler({
      id: existingRuler.id,
      code: "felipe-v-bourbon",
      name: "Felipe V",
    })

    expect(updatedRuler).toMatchObject({
      id: existingRuler.id,
      code: "felipe-v-bourbon",
    })

    const persistedCoinRuler = await db.query.coinRuler.findFirst({
      where: (coinRuler, { eq }) => eq(coinRuler.coinId, createdCoin.id),
    })

    expect(persistedCoinRuler?.rulerId).toBe(existingRuler.id)
  })

  it("returns null when deleting a missing Ruler", async () => {
    await expect(
      deleteRuler({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Ruler", async () => {
    const existingRuler = await createRulerFixture({
      code: "obsolete-ruler",
      name: "Obsolete Ruler",
    })

    await expect(
      deleteRuler({
        id: existingRuler.id,
      })
    ).resolves.toMatchObject({
      id: existingRuler.id,
      code: "obsolete-ruler",
    })
  })

  it("rejects deleting a Ruler while Coin Ruler Attributions still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-ruler-delete",
      name: "Issuer for Ruler Delete",
    })
    const existingRuler = await createRulerFixture({
      code: "in-use-ruler",
      name: "In Use Ruler",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Ruler Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: createdCoin.id,
      rulerId: existingRuler.id,
      rulerOrder: 1,
    })

    await expect(
      deleteRuler({
        id: existingRuler.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_ruler_ruler_id_ruler_id_fk",
      }),
    })
  })
})
