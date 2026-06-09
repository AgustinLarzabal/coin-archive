import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { DemonetizationFilterCombobox } from "./demonetization-filter-combobox"

describe("DemonetizationFilterCombobox", () => {
  it("renders the homepage Demonetization Status combobox with the selected status label and URL value", () => {
    const markup = renderToStaticMarkup(
      <DemonetizationFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedDemonetization={{
          code: "not-demonetized",
          name: "Not demonetized",
        }}
      />
    )

    expect(markup).toContain("Not demonetized")
    expect(markup).toContain("not-demonetized")
  })
})
