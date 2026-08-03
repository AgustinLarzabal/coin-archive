import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createRuler,
  createRulerGroup as createRulerGroupFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createRulerGroup,
  createRulerGroupIdempotently,
  createRulerGroupIdempotentlyWithDatabase,
  deleteRulerGroup,
  deleteRulerGroupIfVersionWithDatabase,
  replaceRulerGroupWithDatabase,
  updateRulerGroup,
} from "./ruler-group"

describe("ruler group mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Ruler Group Code and Ruler Group Name before creating a Ruler Group", async () => {
    await expect(
      createRulerGroup({
        code: "  house-of-bourbon  ",
        name: "  House of Bourbon  ",
      })
    ).resolves.toMatchObject({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
  })

  it("rejects duplicate Ruler Group Codes after normalization", async () => {
    await createRulerGroupFixture({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await expect(
      createRulerGroup({
        code: " house-of-bourbon ",
        name: "Duplicate House of Bourbon",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "ruler_group_code_unique_idx",
      }),
    })
  })

  it("rejects invalid Ruler Group Codes instead of silently normalizing them", async () => {
    await expect(
      createRulerGroup({
        code: "House-Of-Bourbon",
        name: "House of Bourbon",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "ruler_group_code_slug_check",
      }),
    })
  })

  it("allows duplicate Ruler Group Names when Ruler Group Codes differ", async () => {
    const firstRulerGroup = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const secondRulerGroup = await createRulerGroup({
      code: "house-of-bourbon-variant",
      name: "House of Bourbon",
    })

    expect(firstRulerGroup.name).toBe(secondRulerGroup.name)
    expect(firstRulerGroup.id).not.toBe(secondRulerGroup.id)
  })

  it("replays identical idempotent Ruler Group creation and rejects changed payloads", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "ruler-group-create-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " house-of-bourbon ", name: " House of Bourbon " },
    }
    const first = await createRulerGroupIdempotently(input)
    const retry = await createRulerGroupIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      rulerGroup: { code: "house-of-bourbon", version: 1 },
    })
    expect(retry).toMatchObject({ status: "replayed" })
    await expect(
      createRulerGroupIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "house-of-capet", name: "House of Capet" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.rulerGroup.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Ruler Group versions for replacement and deletion", async () => {
    const created = await createRulerGroupIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "versioned-ruler-group-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "house-of-bourbon", name: "House of Bourbon" },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceRulerGroupWithDatabase(db, {
        id: created.rulerGroup.id,
        expectedVersion: 1,
        code: " house-of-capet ",
        name: " House of Capet ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      rulerGroup: { code: "house-of-capet", name: "House of Capet", version: 2 },
    })
    await expect(
      replaceRulerGroupWithDatabase(db, {
        id: created.rulerGroup.id,
        expectedVersion: 1,
        code: "house-of-bourbon",
        name: "House of Bourbon",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteRulerGroupIfVersionWithDatabase(db, {
        id: created.rulerGroup.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteRulerGroupIfVersionWithDatabase(db, {
        id: created.rulerGroup.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves the dependent-Ruler conflict for versioned deletion", async () => {
    const existingRulerGroup = await createRulerGroupFixture({
      code: "in-use-house",
      name: "In Use House",
    })
    await createRuler({
      code: "in-use-ruler",
      name: "In Use Ruler",
      rulerGroupId: existingRulerGroup.id,
    })

    await expect(
      deleteRulerGroupIfVersionWithDatabase(db, {
        id: existingRulerGroup.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "ruler_ruler_group_id_ruler_group_id_fk",
      }),
    })
  })

  it("trims Ruler Group Code and Ruler Group Name before updating a Ruler Group", async () => {
    const existingRulerGroup = await createRulerGroupFixture({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await expect(
      updateRulerGroup({
        id: existingRulerGroup.id,
        code: "  house-of-capet  ",
        name: "  House of Capet  ",
      })
    ).resolves.toMatchObject({
      id: existingRulerGroup.id,
      code: "house-of-capet",
      name: "House of Capet",
    })
  })

  it("returns null when the Ruler Group update target no longer exists", async () => {
    await expect(
      updateRulerGroup({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "house-of-bourbon",
        name: "House of Bourbon",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Ruler relationships when a Ruler Group Code changes", async () => {
    const createdRulerGroup = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const createdRuler = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: createdRulerGroup.id,
    })

    const updatedRulerGroup = await updateRulerGroup({
      id: createdRulerGroup.id,
      code: "house-of-capet",
      name: "House of Capet",
    })

    expect(updatedRulerGroup).toMatchObject({
      id: createdRulerGroup.id,
      code: "house-of-capet",
    })

    const persistedRuler = await db.query.ruler.findFirst({
      where: (ruler, { eq }) => eq(ruler.id, createdRuler.id),
    })

    expect(persistedRuler?.rulerGroupId).toBe(createdRulerGroup.id)
  })

  it("returns null when deleting a missing Ruler Group", async () => {
    await expect(
      deleteRulerGroup({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Ruler Group", async () => {
    const existingRulerGroup = await createRulerGroupFixture({
      code: "obsolete-house",
      name: "Obsolete House",
    })

    await expect(
      deleteRulerGroup({
        id: existingRulerGroup.id,
      })
    ).resolves.toMatchObject({
      id: existingRulerGroup.id,
      code: "obsolete-house",
    })
  })

  it("rejects deleting a Ruler Group while Rulers still use it", async () => {
    const existingRulerGroup = await createRulerGroupFixture({
      code: "in-use-house",
      name: "In Use House",
    })

    await createRuler({
      code: "in-use-ruler",
      name: "In Use Ruler",
      rulerGroupId: existingRulerGroup.id,
    })

    await expect(
      deleteRulerGroup({
        id: existingRulerGroup.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "ruler_ruler_group_id_ruler_group_id_fk",
      }),
    })
  })
})
