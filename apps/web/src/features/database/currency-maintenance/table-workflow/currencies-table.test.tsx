import type { CurrencyOption } from "@coin-archive/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CurrenciesTable, filterCurrencies } from "./currencies-table"

const currencies: CurrencyOption[] = [
  {
    id: "d77c3a0c-1a77-4332-ae7c-732cbf95d479",
    code: "argentine-peso",
    name: "Peso",
    fullName: "Argentine peso",
    createdAt: new Date("2026-06-24T12:00:00.000Z"),
    updatedAt: new Date("2026-06-24T12:00:00.000Z"),
  },
  {
    id: "baf020cb-1009-40b9-a286-cf5bd49d6a0b",
    code: "united-states-dollar",
    name: "Dollar",
    fullName: "United States dollar",
    createdAt: new Date("2026-06-24T12:00:00.000Z"),
    updatedAt: new Date("2026-06-24T12:00:00.000Z"),
  },
]

describe("filterCurrencies", () => {
  it("returns all currencies when the filter is blank", () => {
    expect(filterCurrencies(currencies, "")).toStrictEqual(currencies)
  })

  it("filters by code, name, and full name case-insensitively while trimming whitespace", () => {
    expect(filterCurrencies(currencies, "peso")).toStrictEqual([currencies[0]])
    expect(filterCurrencies(currencies, " STATES ")).toStrictEqual([
      currencies[1],
    ])
    expect(filterCurrencies(currencies, "dollar")).toStrictEqual([
      currencies[1],
    ])
  })
})

describe("CurrenciesTable", () => {
  it("renders compact Code, Name, and Full Name columns with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <CurrenciesTable currencies={currencies} />
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Name")
    expect(markup).toContain("Full Name")
    expect(markup).toContain("Argentine peso")
    expect(markup).toContain("United States dollar")
    expect(markup).toContain("Filter currencies by code, name, or full name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
