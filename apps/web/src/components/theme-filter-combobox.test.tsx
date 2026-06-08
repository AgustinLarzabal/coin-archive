import type { ThemeOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ThemeFilterCombobox } from "./theme-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const themes: ThemeOption[] = [
  {
    id: "theme-1",
    code: "building",
    name: "Building",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "theme-2",
    code: "map",
    name: "Map",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("ThemeFilterCombobox", () => {
  it("renders the homepage Theme combobox with the selected theme name and code label", () => {
    const markup = renderToStaticMarkup(
      <ThemeFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedTheme={themes[0]}
        themes={themes}
      />
    )

    expect(markup).toContain("Building")
    expect(markup).toContain("building")
  })
})
