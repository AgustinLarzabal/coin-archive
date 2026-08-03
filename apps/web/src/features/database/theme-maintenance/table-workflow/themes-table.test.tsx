import type { Theme } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { filterThemes, ThemesTable } from "./themes-table"

const themes: Theme[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"theme-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"theme-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterThemes", () => {
  it("returns all Themes when the filter is blank", () => {
    expect(filterThemes(themes, "")).toStrictEqual(themes)
  })

  it("filters by Theme Code and Theme Name case-insensitively while trimming whitespace", () => {
    expect(filterThemes(themes, " reeded ")).toStrictEqual([themes[0]])
    expect(filterThemes(themes, "PLAIN")).toStrictEqual([themes[1]])
  })
})

describe("ThemesTable", () => {
  it("renders Theme Name and Theme Code columns with maintenance affordances", () => {
    const markup = renderToStaticMarkup(<ThemesTable themes={themes} />)

    expect(markup).toContain("Theme Code")
    expect(markup).toContain("Theme Name")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain("Filter themes by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })

  it("renders a table-level success message when one is available", () => {
    const markup = renderToStaticMarkup(
      <ThemesTable themes={themes} initialSuccessMessage="Theme deleted." />
    )

    expect(markup).toContain('role="status"')
    expect(markup).toContain("Theme deleted.")
  })
})
