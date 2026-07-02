import { renderToStaticMarkup } from "react-dom/server"
import type { ThemeOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { THEME_AUTHORIZATION_ERROR } from "@/lib/theme-maintenance"
import { databaseSecondaryMenuItems } from "./-navigation-items"
import { loadThemeMaintenanceThemes, renderDatabaseThemesPage } from "./themes"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

function createTheme(
  overrides: Pick<ThemeOption, "id" | "code" | "name">
): ThemeOption {
  return overrides
}

describe("databaseSecondaryMenuItems", () => {
  it("includes the Themes maintenance entry after Engravers", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/themes",
      label: "Themes",
    })

    expect(databaseSecondaryMenuItems[9]).toStrictEqual({
      to: "/database/engravers",
      label: "Engravers",
    })
    expect(databaseSecondaryMenuItems[10]).toStrictEqual({
      to: "/database/themes",
      label: "Themes",
    })
    expect(databaseSecondaryMenuItems[11]).toStrictEqual({
      to: "/database/issuers",
      label: "Issuers",
    })
  })
})

describe("loadThemeMaintenanceThemes", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getThemes = vi.fn()

    await expect(loadThemeMaintenanceThemes(null, { getThemes })).resolves.toStrictEqual(
      {
        status: "error",
        formError: THEME_AUTHORIZATION_ERROR,
      }
    )

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
    const themes = [
      createTheme({
        id: "3fc6f779-e225-45f7-9ef6-40e80e6ef9ef",
        code: "map",
        name: "Map",
      }),
    ]
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

describe("renderDatabaseThemesPage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseThemesPage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Themes table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseThemesPage({
        isAllowed: true,
        themes: [
          createTheme({
            id: "3fc6f779-e225-45f7-9ef6-40e80e6ef9ef",
            code: "map",
            name: "Map",
          }),
          createTheme({
            id: "7bf1fdc0-cceb-4dda-a8dd-b004a6f35775",
            code: "portrait",
            name: "Portrait",
          }),
        ],
      })
    )

    expect(markup).toContain("Theme Code")
    expect(markup).toContain("Theme Name")
    expect(markup).toContain("Map")
    expect(markup).toContain("Portrait")
    expect(markup).toContain("Filter themes by code or name...")
    expect(markup).not.toContain(">Create</button>")
    expect(markup).not.toContain('aria-label="Actions"')
  })
})
