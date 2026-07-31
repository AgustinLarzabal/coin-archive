import { renderToStaticMarkup } from "react-dom/server"
import type { ThemeOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { renderThemeMaintenancePage } from "./theme-maintenance-page"

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

const PORTRAIT_THEME = createTheme({
  id: "7bf1fdc0-cceb-4dda-a8dd-b004a6f35775",
  code: "portrait",
  name: "Portrait",
})

describe("renderThemeMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderThemeMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Themes table for allowed Editors and Admins with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderThemeMaintenancePage({
        isAllowed: true,
        themes: [MAP_THEME, PORTRAIT_THEME],
      })
    )

    expect(markup).toContain("Theme Code")
    expect(markup).toContain("Theme Name")
    expect(markup).toContain("Map")
    expect(markup).toContain("Portrait")
    expect(markup).toContain("Filter themes by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
