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
      distributions: [
        {
          id: "distribution-1",
          code: "circulation",
          name: "Circulation",
        },
      ],
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
    const distributionField = selectGroup.fields[1]
    const engraverField = selectGroup.fields[2]

    expect(selectGroup.fields).toHaveLength(3)
    expect(issuerField).toBeDefined()
    expect(distributionField).toBeDefined()
    expect(engraverField).toBeDefined()

    if (!issuerField || !distributionField || !engraverField) {
      throw new Error("Expected issuer, distribution, and engraver fields")
    }

    expect(issuerField.label).toBe("Issuer")
    expect(distributionField.label).toBe("Distribution")
    expect(engraverField.label).toBe("Engraver")
    expect(renderToStaticMarkup(<>{issuerField.icon}</>)).toContain("svg")
  })
})

describe("getHomeFilters", () => {
  it("creates filters from the selected route state", () => {
    expect(
      getHomeFilters({
        selectedDistributionCode: "circulation",
        selectedEngraverCode: "john-doe",
        selectedIssuerCode: "spain",
      }).map(({ field, operator, values }) => ({
        field,
        operator,
        values,
      }))
    ).toStrictEqual(
      [
        createFilter("distribution", "is", ["circulation"]),
        createFilter("engraver", "is", ["john-doe"]),
        createFilter("issuer", "is", ["spain"]),
      ].map(({ field, operator, values }) => ({
        field,
        operator,
        values,
      }))
    )
  })
})

describe("getHomeFilterValues", () => {
  it("maps filter widgets back to search values", () => {
    expect(
      getHomeFilterValues([
        createFilter("distribution", "is", [" Circulation "]),
        createFilter("engraver", "is", [" John-Doe "]),
        createFilter("issuer", "is", [" Spain "]),
      ])
    ).toStrictEqual({
      distributionCode: "Circulation",
      engraverCode: "John-Doe",
      issuerCode: "Spain",
    })
  })

  it("drops blank filter values", () => {
    expect(
      getHomeFilterValues([
        createFilter("distribution", "is", ["   "]),
        createFilter("engraver", "is", ["   "]),
        createFilter("issuer", "is", ["spain"]),
      ])
    ).toStrictEqual({
      distributionCode: undefined,
      engraverCode: undefined,
      issuerCode: "spain",
    })
  })
})
