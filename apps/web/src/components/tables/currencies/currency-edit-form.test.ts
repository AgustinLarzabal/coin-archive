import type { CurrencyOption } from "@workspace/db"
import { describe, expect, it } from "vitest"

import { hasCurrencyEditChanges } from "./currency-edit-form"

const currency: CurrencyOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "united-states-dollar",
  name: "Dollar",
  fullName: "United States dollar",
  createdAt: new Date("2026-06-26T00:00:00.000Z"),
  updatedAt: new Date("2026-06-26T00:00:00.000Z"),
}

describe("hasCurrencyEditChanges", () => {
  it("returns false when trimmed editable values match the current Currency", () => {
    expect(
      hasCurrencyEditChanges(currency, {
        code: " united-states-dollar ",
        name: " Dollar ",
        fullName: " United States dollar ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasCurrencyEditChanges(currency, {
        code: "argentine-peso",
        name: "Peso",
        fullName: "Argentine peso",
      })
    ).toBe(true)
  })
})
