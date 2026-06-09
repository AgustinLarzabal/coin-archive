import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { DemonetizationFilterCombobox } from "./demonetization-filter-combobox"

describe("DemonetizationFilterCombobox", () => {
  it("renders the homepage Demonetization Status combobox with the selected status restored from search state", () => {
    const markup = renderToStaticMarkup(
      <DemonetizationFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedDemonetization="not-demonetized"
      />
    )

    expect(markup).toContain("Not demonetized")
    expect(markup).toContain("Filter by Demonetization Status")
  })
})
