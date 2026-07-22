import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { CoinSelectField } from "./coin-select-field"

describe("CoinSelectField", () => {
  it("shows the selected option label instead of its stored ID", () => {
    const markup = renderToStaticMarkup(
      <CoinSelectField
        id="coin-currency"
        label="Currency"
        onValueChange={vi.fn()}
        options={[{ id: "currency-eur", code: "eur", name: "Euro" }]}
        placeholder="Select Currency"
        value="currency-eur"
      />
    )

    expect(markup).toContain("Euro (eur)")
    expect(markup).not.toContain(">currency-eur<")
  })
})
