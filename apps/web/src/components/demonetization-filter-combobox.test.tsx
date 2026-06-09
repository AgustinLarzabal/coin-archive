import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { demonetizationFilterOptions } from "../lib/coin-search"
import { DemonetizationFilterCombobox } from "./demonetization-filter-combobox"

const selectedDemonetization = demonetizationFilterOptions.find(
  (option) => option.code === "not-demonetized"
)

if (!selectedDemonetization) {
  throw new Error("Expected not-demonetized filter option to exist")
}

describe("DemonetizationFilterCombobox", () => {
  it("restores the selected homepage Demonetization Status label and URL value", () => {
    const markup = renderToStaticMarkup(
      <DemonetizationFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedDemonetization={selectedDemonetization}
      />
    )

    expect(markup).toContain(`value="${selectedDemonetization.name}"`)
    expect(markup).toContain(
      `&quot;code&quot;:&quot;${selectedDemonetization.code}&quot;`
    )
  })
})
