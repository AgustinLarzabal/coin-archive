import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { findSelectedCodeOption } from "../lib/coin-search"
import { coinCodeFilterConfigs } from "../lib/coin-filter-configs"
import type { CoinFilterOptions } from "../lib/coin-filter-configs"
import { NamedCodeFilterCombobox } from "./named-code-filter-combobox"

type TestOption = { code: string; name: string }

const edges: TestOption[] = [
  { code: "reeded", name: "Reeded" },
  { code: "lettered", name: "Lettered" },
]

describe("NamedCodeFilterCombobox", () => {
  it("renders the selected item name and code label", () => {
    const markup = renderToStaticMarkup(
      <NamedCodeFilterCombobox<TestOption>
        emptyMessage="No edges found."
        items={edges}
        itemToStringLabel={(edge) => edge.name}
        onValueChange={() => Promise.resolve()}
        placeholder="Filter by edge"
        selectedItem={edges[0]}
      />
    )

    expect(markup).toContain("Reeded")
    expect(markup).toContain("reeded")
  })
})

describe("coinCodeFilterConfigs", () => {
  it("restores the selected Demonetization Status label and URL value", () => {
    const config = coinCodeFilterConfigs.find(
      ({ name }) => name === "demonetization"
    )

    if (!config) {
      throw new Error("Expected demonetization filter config to exist")
    }

    const { name, getItems, ...comboboxProps } = config
    // The demonetization config uses static options and ignores loader data.
    const items = getItems({} as CoinFilterOptions)
    const selectedItem = findSelectedCodeOption(items, "not-demonetized")

    const markup = renderToStaticMarkup(
      <NamedCodeFilterCombobox
        items={items}
        onValueChange={() => Promise.resolve()}
        selectedItem={selectedItem}
        {...comboboxProps}
      />
    )

    expect(markup).toContain('value="Not demonetized"')
    expect(markup).toContain("&quot;code&quot;:&quot;not-demonetized&quot;")
  })
})
