import type { ThemeOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { THEME_AUTHORIZATION_ERROR } from "./actions"
import { loadThemeMaintenanceThemes } from "./theme-maintenance-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

function createTheme(
  overrides: Pick<ThemeOption, "id" | "code" | "name">
): ThemeOption {
  return overrides
}

const MAP_THEME = createTheme({
  id: "3fc6f779-e225-45f7-9ef6-40e80e6ef9ef",
  code: "map",
  name: "Map",
})

describe("loadThemeMaintenanceThemes", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getThemes = vi.fn()

    await expect(
      loadThemeMaintenanceThemes(null, { getThemes })
    ).resolves.toStrictEqual({
      status: "error",
      formError: THEME_AUTHORIZATION_ERROR,
    })

    expect(getThemes).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getThemes = vi.fn()

    await expect(
      loadThemeMaintenanceThemes({ role: "collector" }, { getThemes })
    ).resolves.toStrictEqual({
      status: "error",
      formError: THEME_AUTHORIZATION_ERROR,
    })

    expect(getThemes).not.toHaveBeenCalled()
  })

  it("returns Theme records for Editors and Admins", async () => {
    const themes = [MAP_THEME]
    const getThemes = vi.fn().mockResolvedValue(themes)

    await expect(
      loadThemeMaintenanceThemes({ role: "editor" }, { getThemes })
    ).resolves.toStrictEqual({
      status: "success",
      themes,
    })

    await expect(
      loadThemeMaintenanceThemes({ role: "admin" }, { getThemes })
    ).resolves.toStrictEqual({
      status: "success",
      themes,
    })
  })
})
