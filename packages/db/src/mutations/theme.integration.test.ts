import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCoinTheme,
  createTheme as createThemeFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createTheme,
  createThemeIdempotently,
  createThemeIdempotentlyWithDatabase,
  deleteTheme,
  deleteThemeIfVersionWithDatabase,
  replaceThemeWithDatabase,
  updateTheme,
} from "./theme"

describe("theme mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Theme Code and Theme Name before creating a Theme", async () => {
    await expect(
      createTheme({
        code: "  reeded  ",
        name: "  Reeded  ",
      })
    ).resolves.toMatchObject({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("rejects duplicate Theme Codes after normalization", async () => {
    await createThemeFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      createTheme({
        code: " reeded ",
        name: "Duplicate Reeded",
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
        code: "Reeded",
        name: "Reeded",
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
      code: "reeded",
      name: "Reeded",
    })
    const secondTheme = await createTheme({
      code: "reeded-variant",
      name: "Reeded",
    })

    expect(firstTheme.name).toBe(secondTheme.name)
    expect(firstTheme.id).not.toBe(secondTheme.id)
  })

  it("persists and replays an identical idempotent Theme create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "theme-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: " reeded ", name: " Reeded " },
    }
    const first = await createThemeIdempotently(input)
    const retry = await createThemeIdempotently(input)
    expect(first).toMatchObject({
      status: "created",
      theme: { code: "reeded", name: "Reeded", version: 1 },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      theme: first.status === "created" ? first.theme : expect.anything(),
    })
    await expect(db.query.theme.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of a Theme create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "theme-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    }
    await createThemeIdempotently(input)
    await expect(
      createThemeIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: { code: "plain", name: "Plain" },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.theme.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Theme versions for replacement and deletion", async () => {
    const created = await createThemeIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "theme-request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: { code: "reeded", name: "Reeded" },
    })
    if (created.status !== "created") throw new Error("Expected create")
    await expect(
      replaceThemeWithDatabase(db, {
        id: created.theme.id,
        expectedVersion: 1,
        code: " plain ",
        name: " Plain ",
      })
    ).resolves.toMatchObject({
      status: "updated",
      theme: { version: 2, code: "plain", name: "Plain" },
    })
    await expect(
      replaceThemeWithDatabase(db, {
        id: created.theme.id,
        expectedVersion: 1,
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteThemeIfVersionWithDatabase(db, {
        id: created.theme.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteThemeIfVersionWithDatabase(db, {
        id: created.theme.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("preserves Theme constraints through versioned API mutations", async () => {
    const first = await createThemeFixture({ code: "reeded", name: "Reeded" })
    const second = await createThemeFixture({ code: "plain", name: "Plain" })

    await expect(
      replaceThemeWithDatabase(db, {
        id: second.id,
        expectedVersion: 1,
        code: "reeded",
        name: second.name,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "theme_code_lower_unique_idx",
      }),
    })

    const issuer = await createIssuer({
      code: "versioned-theme-delete-issuer",
      name: "Versioned Theme Delete Issuer",
    })
    const coin = await createCoin({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      issuerId: issuer.id,
      title: "Versioned Theme Delete Coin",
    })
    await createCoinTheme({
      coinId: coin.id,
      themeId: first.id,
    })

    await expect(
      deleteThemeIfVersionWithDatabase(db, {
        id: first.id,
        expectedVersion: 1,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_theme_theme_id_theme_id_fk",
      }),
    })
  })

  it("trims Theme Code and Theme Name before updating a Theme", async () => {
    const existingTheme = await createThemeFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      updateTheme({
        id: existingTheme.id,
        code: "  lettered  ",
        name: "  Lettered  ",
      })
    ).resolves.toMatchObject({
      id: existingTheme.id,
      code: "lettered",
      name: "Lettered",
    })
  })

  it("updates the Theme timestamp in place", async () => {
    const existingTheme = await createThemeFixture({
      code: "barth",
      name: "Barth",
    })

    await new Promise((resolve) => setTimeout(resolve, 5))

    const updatedTheme = await updateTheme({
      id: existingTheme.id,
      code: "durand",
      name: "Durand",
    })

    expect(updatedTheme).toMatchObject({
      id: existingTheme.id,
      createdAt: existingTheme.createdAt,
    })
    expect(updatedTheme?.updatedAt.getTime()).toBeGreaterThan(
      existingTheme.updatedAt.getTime()
    )
  })

  it("rejects duplicate Theme Codes during replacement", async () => {
    const existingTheme = await createThemeFixture({
      code: "barth",
      name: "Barth",
    })
    const conflictingTheme = await createThemeFixture({
      code: "durand",
      name: "Durand",
    })

    await expect(
      replaceThemeWithDatabase(db, {
        id: conflictingTheme.id,
        expectedVersion: 1,
        code: " barth ",
        name: "Updated Durand",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "theme_code_lower_unique_idx",
      }),
    })
    expect(existingTheme.code).toBe("barth")
  })

  it("rejects invalid Theme Codes during replacement", async () => {
    const existingTheme = await createThemeFixture({
      code: "barth",
      name: "Barth",
    })

    await expect(
      replaceThemeWithDatabase(db, {
        id: existingTheme.id,
        expectedVersion: 1,
        code: "Barth",
        name: "Updated Barth",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "theme_code_slug_check",
      }),
    })
  })

  it("returns null when the Theme update target no longer exists", async () => {
    await expect(
      updateTheme({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Theme Attributions when a Theme Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-theme-update",
      name: "Issuer for Theme Update",
    })
    const createdTheme = await createTheme({
      code: "reeded",
      name: "Reeded",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Theme-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })
    await createCoinTheme({
      coinId: createdCoin.id,
      themeId: createdTheme.id,
    })

    const updatedTheme = await updateTheme({
      id: createdTheme.id,
      code: "lettered",
      name: "Lettered",
    })

    expect(updatedTheme).toMatchObject({
      id: createdTheme.id,
      code: "lettered",
    })

    const persistedAttribution = await db.query.coinTheme.findFirst({
      where: (attribution, { and, eq }) =>
        and(
          eq(attribution.coinId, createdCoin.id),
          eq(attribution.themeId, createdTheme.id)
        ),
    })

    expect(persistedAttribution).toBeDefined()
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

  it("rejects deleting a Theme while Theme Attributions still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-theme-delete",
      name: "Issuer for Theme Delete",
    })
    const existingTheme = await createThemeFixture({
      code: "in-use-theme",
      name: "In Use Theme",
    })

    const coin = await createCoin({
      issuerId: issuer.id,
      title: "Theme Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })
    await createCoinTheme({
      coinId: coin.id,
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
