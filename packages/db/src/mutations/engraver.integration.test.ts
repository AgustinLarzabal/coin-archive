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
import { createEngraver, deleteEngraver, updateEngraver } from "./engraver"

describe("engraver mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Engraver Code and Engraver Name before creating an Engraver", async () => {
    await expect(
      createEngraver({
        code: "  barth  ",
        name: "  Barth  ",
      })
    ).resolves.toMatchObject({
      code: "barth",
      name: "Barth",
    })
  })

  it("rejects duplicate Engraver Codes after normalization", async () => {
    await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })

    await expect(
      createEngraver({
        code: " barth ",
        name: "Duplicate Barth",
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
        code: "Barth",
        name: "Barth",
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
      code: "barth",
      name: "Barth",
    })
    const secondEngraver = await createEngraver({
      code: "barth-variant",
      name: "Barth",
    })

    expect(firstEngraver.name).toBe(secondEngraver.name)
    expect(firstEngraver.id).not.toBe(secondEngraver.id)
  })

  it("trims Engraver Code and Engraver Name before updating an Engraver", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })

    await expect(
      updateEngraver({
        id: existingEngraver.id,
        code: "  durand  ",
        name: "  Durand  ",
      })
    ).resolves.toMatchObject({
      id: existingEngraver.id,
      code: "durand",
      name: "Durand",
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

  it("rejects duplicate Engraver Codes case-insensitively during update", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })
    const conflictingEngraver = await createEngraverFixture({
      code: "durand",
      name: "Durand",
    })

    await expect(
      updateEngraver({
        id: conflictingEngraver.id,
        code: " BARTH ",
        name: "Updated Durand",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "engraver_code_lower_unique_idx",
      }),
    })

    await expect(
      db.query.engraver.findFirst({
        where: (engraver, { eq }) => eq(engraver.id, conflictingEngraver.id),
      })
    ).resolves.toMatchObject({
      id: conflictingEngraver.id,
      code: "durand",
      name: "Durand",
    })
    expect(existingEngraver.code).toBe("barth")
  })

  it("rejects invalid Engraver Codes during update instead of silently normalizing them", async () => {
    const existingEngraver = await createEngraverFixture({
      code: "barth",
      name: "Barth",
    })

    await expect(
      updateEngraver({
        id: existingEngraver.id,
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
        code: "barth",
        name: "Barth",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Engraver Attributions when an Engraver Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-engraver-update",
      name: "Issuer for Engraver Update",
    })
    const createdEngraver = await createEngraver({
      code: "barth",
      name: "Barth",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Engraver-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })
    const obverseSurface = await createCoinSurface({
      coinId: createdCoin.id,
      kind: "obverse",
    })

    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: createdEngraver.id,
    })

    const updatedEngraver = await updateEngraver({
      id: createdEngraver.id,
      code: "durand",
      name: "Durand",
    })

    expect(updatedEngraver).toMatchObject({
      id: createdEngraver.id,
      code: "durand",
    })

    const persistedAttribution = await db.query.coinSurfaceEngraver.findFirst({
      where: (coinSurfaceEngraver, { and, eq }) =>
        and(
          eq(coinSurfaceEngraver.coinSurfaceId, obverseSurface.id),
          eq(coinSurfaceEngraver.engraverId, createdEngraver.id)
        ),
    })

    expect(persistedAttribution).not.toBeNull()
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
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Engraver Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })
    const reverseSurface = await createCoinSurface({
      coinId: createdCoin.id,
      kind: "reverse",
    })

    await createCoinSurfaceEngraver({
      coinSurfaceId: reverseSurface.id,
      engraverId: existingEngraver.id,
    })

    await expect(
      deleteEngraver({
        id: existingEngraver.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_face_engraver_engraver_id_fkey",
      }),
    })
  })
})
