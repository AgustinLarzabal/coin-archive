import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { demonetizationFilterOptions } from "../lib/coin-search"
import { DemonetizationFilterCombobox } from "./demonetization-filter-combobox"

describe("DemonetizationFilterCombobox", () => {
  it("restores the selected homepage Demonetization Status label and URL value", () => {
    const markup = renderToStaticMarkup(
      <DemonetizationFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedDemonetization={demonetizationFilterOptions[1]}
      />
    )

    expect(markup).toContain('value="Not demonetized"')
    expect(markup).toContain("&quot;code&quot;:&quot;not-demonetized&quot;")
  })
})
