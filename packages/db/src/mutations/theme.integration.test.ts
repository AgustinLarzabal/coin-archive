import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCoinTheme,
  createIssuer,
  createTheme as createThemeFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createTheme, deleteTheme, updateTheme } from "./theme"

describe("theme mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Theme Code and Theme Name before creating a Theme", async () => {
    await expect(
      createTheme({
        code: "  map  ",
        name: "  Map  ",
      })
    ).resolves.toMatchObject({
      code: "map",
      name: "Map",
    })
  })

  it("rejects duplicate Theme Codes after normalization", async () => {
    await createThemeFixture({
      code: "map",
      name: "Map",
    })

    await expect(
      createTheme({
        code: " map ",
        name: "Duplicate Map",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "theme_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Theme Codes instead of silently normalizing them", async () => {
    await expect(
      createTheme({
        code: "Map",
        name: "Map",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "theme_code_slug_check",
      }),
    })
  })

  it("allows duplicate Theme Names when Theme Codes differ", async () => {
    const firstTheme = await createTheme({
      code: "map",
      name: "Map",
    })
    const secondTheme = await createTheme({
      code: "map-variant",
      name: "Map",
    })

    expect(firstTheme.name).toBe(secondTheme.name)
    expect(firstTheme.id).not.toBe(secondTheme.id)
  })

  it("trims Theme Code and Theme Name before updating a Theme", async () => {
    const existingTheme = await createThemeFixture({
      code: "map",
      name: "Map",
    })

    await expect(
      updateTheme({
        id: existingTheme.id,
        code: "  animal  ",
        name: "  Animal  ",
      })
    ).resolves.toMatchObject({
      id: existingTheme.id,
      code: "animal",
      name: "Animal",
    })
  })

  it("returns null when the Theme update target no longer exists", async () => {
    await expect(
      updateTheme({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "map",
        name: "Map",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Theme Attributions when a Theme Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-theme-update",
      name: "Issuer for Theme Update",
    })
    const createdTheme = await createTheme({
      code: "map",
      name: "Map",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Theme-linked coin",
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: createdCoin.id,
      themeId: createdTheme.id,
    })

    const updatedTheme = await updateTheme({
      id: createdTheme.id,
      code: "animal",
      name: "Animal",
    })

    expect(updatedTheme).toMatchObject({
      id: createdTheme.id,
      code: "animal",
    })

    const persistedCoinTheme = await db.query.coinTheme.findFirst({
      where: (coinTheme, { and, eq }) =>
        and(
          eq(coinTheme.coinId, createdCoin.id),
          eq(coinTheme.themeId, createdTheme.id)
        ),
    })

    expect(persistedCoinTheme).toBeDefined()
  })

  it("returns null when deleting a missing Theme", async () => {
    await expect(
      deleteTheme({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Theme", async () => {
    const existingTheme = await createThemeFixture({
      code: "obsolete-theme",
      name: "Obsolete Theme",
    })

    await expect(
      deleteTheme({
        id: existingTheme.id,
      })
    ).resolves.toMatchObject({
      id: existingTheme.id,
      code: "obsolete-theme",
    })
  })

  it("rejects deleting a Theme while Theme Attributions still reference it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-theme-delete",
      name: "Issuer for Theme Delete",
    })
    const existingTheme = await createThemeFixture({
      code: "in-use-theme",
      name: "In Use Theme",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Theme Restrict Delete Coin",
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: createdCoin.id,
      themeId: existingTheme.id,
    })

    await expect(
      deleteTheme({
        id: existingTheme.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_theme_theme_id_theme_id_fk",
      }),
    })
  })
})
