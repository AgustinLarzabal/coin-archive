import type { ThemeOption } from "@coin-archive/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { filterThemes, ThemesTable } from "./themes-table"

const themes: ThemeOption[] = [
  {
    id: "3fc6f779-e225-45f7-9ef6-40e80e6ef9ef",
    code: "map",
    name: "Map",
  },
  {
    id: "7bf1fdc0-cceb-4dda-a8dd-b004a6f35775",
    code: "portrait",
    name: "Portrait",
  },
]

describe("filterThemes", () => {
  it("returns all Themes when the filter is blank", () => {
    expect(filterThemes(themes, "")).toStrictEqual(themes)
  })

  it("filters by Theme Code and Theme Name case-insensitively while trimming whitespace", () => {
    expect(filterThemes(themes, " map ")).toStrictEqual([themes[0]])
    expect(filterThemes(themes, "PORTRAIT")).toStrictEqual([themes[1]])
  })
})

describe("ThemesTable", () => {
  it("renders Theme Code and Theme Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<ThemesTable themes={themes} />)

    expect(markup).toContain("Theme Code")
    expect(markup).toContain("Theme Name")
    expect(markup).toContain("Map")
    expect(markup).toContain("Portrait")
    expect(markup).toContain("Filter themes by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })

  it("renders a table-level success message when one is available", () => {
    const markup = renderToStaticMarkup(
      <ThemesTable
        themes={themes}
        initialSuccessMessage="Theme deleted."
      />
    )

    expect(markup).toContain('role="status"')
    expect(markup).toContain("Theme deleted.")
  })
})
