import { createFilter } from "@workspace/ui/components/reui/filters"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import {
  getHomeFilterFields,
  getHomeFilters,
  getHomeFilterValues,
} from "./home-filters.helpers"

describe("getHomeFilterFields", () => {
  it("builds the supported home filter fields", () => {
    const fields = getHomeFilterFields({
      engravers: [
        {
          id: "engraver-1",
          code: "john-doe",
          name: "John Doe",
        },
      ],
      issuers: [
        {
          id: "issuer-1",
          code: "spain",
          isoCode: "ES",
          name: "Spain",
        },
      ],
    })
    const selectGroup = fields[0]

    expect(fields).toHaveLength(1)
    expect(selectGroup).toBeDefined()

    if (!selectGroup) {
      throw new Error("Expected a select filter group")
    }

    expect(selectGroup.fields).toBeDefined()

    if (!selectGroup.fields) {
      throw new Error("Expected grouped filter fields")
    }

    const issuerField = selectGroup.fields[0]
    const engraverField = selectGroup.fields[1]

    expect(selectGroup.fields).toHaveLength(2)
    expect(issuerField).toBeDefined()
    expect(engraverField).toBeDefined()

    if (!issuerField || !engraverField) {
      throw new Error("Expected issuer and engraver fields")
    }

    expect(issuerField.label).toBe("Issuer")
    expect(engraverField.label).toBe("Engraver")
    expect(renderToStaticMarkup(<>{issuerField.icon}</>)).toContain("svg")
  })
})

describe("getHomeFilters", () => {
  it("creates filters from the selected route state", () => {
    expect(
      getHomeFilters({
        selectedEngraverCode: "john-doe",
        selectedIssuerCode: "spain",
      }).map(({ field, operator, values }) => ({
        field,
        operator,
        values,
      }))
    ).toStrictEqual(
      [createFilter("engraver", "is", ["john-doe"]), createFilter("issuer", "is", ["spain"])].map(
        ({ field, operator, values }) => ({
          field,
          operator,
          values,
        })
      )
    )
  })
})

describe("getHomeFilterValues", () => {
  it("maps filter widgets back to search values", () => {
    expect(
      getHomeFilterValues([
        createFilter("engraver", "is", [" John-Doe "]),
        createFilter("issuer", "is", [" Spain "]),
      ])
    ).toStrictEqual({
      engraverCode: "John-Doe",
      issuerCode: "Spain",
    })
  })

  it("drops blank filter values", () => {
    expect(
      getHomeFilterValues([
        createFilter("engraver", "is", ["   "]),
        createFilter("issuer", "is", ["spain"]),
      ])
    ).toStrictEqual({
      engraverCode: undefined,
      issuerCode: "spain",
    })
  })
})
