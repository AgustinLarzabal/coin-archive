import { createFilter } from "@coin-archive/ui/components/reui/filters"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { RULER_FILTER_LABEL } from "../../lib/ruler-filter"
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
      rulers: [
        {
          id: "ruler-1",
          code: "charles-iii",
          name: "Charles III",
          group: null,
        },
      ],
      themes: [
        {
          id: "theme-1",
          code: "map",
          name: "Map",
        },
      ],
    })
    const selectGroup = fields[0]

    expect(fields).toHaveLength(1)
    expect(selectGroup).toBeDefined()

    expect(selectGroup.fields).toBeDefined()

    if (!selectGroup.fields) {
      throw new Error("Expected grouped filter fields")
    }

    const issuerField = selectGroup.fields[0]
    const distributionField = selectGroup.fields[1]
    const engraverField = selectGroup.fields[2]
    const rulerField = selectGroup.fields[3]
    const themeField = selectGroup.fields[4]

    expect(selectGroup.fields).toHaveLength(5)
    expect(issuerField).toBeDefined()
    expect(distributionField).toBeDefined()
    expect(engraverField).toBeDefined()
    expect(themeField).toBeDefined()
    expect(rulerField).toBeDefined()

    expect(issuerField.label).toBe("Issuer")
    expect(distributionField.label).toBe("Distribution")
    expect(engraverField.label).toBe("Engraver")
    expect(themeField.label).toBe("Theme")
    expect(rulerField.label).toBe(RULER_FILTER_LABEL)
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
        selectedRulerCode: "charles-iii",
        selectedThemeCode: "map",
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
        createFilter("ruler", "is", ["charles-iii"]),
        createFilter("theme", "is", ["map"]),
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
        createFilter("ruler", "is", [" Charles-III "]),
        createFilter("theme", "is", [" Map "]),
      ])
    ).toStrictEqual({
      distributionCode: "Circulation",
      engraverCode: "John-Doe",
      issuerCode: "Spain",
      rulerCode: "Charles-III",
      themeCode: "Map",
    })
  })

  it("drops blank filter values", () => {
    expect(
      getHomeFilterValues([
        createFilter("distribution", "is", ["   "]),
        createFilter("engraver", "is", ["   "]),
        createFilter("issuer", "is", ["spain"]),
        createFilter("ruler", "is", ["   "]),
        createFilter("theme", "is", ["   "]),
      ])
    ).toStrictEqual({
      distributionCode: undefined,
      engraverCode: undefined,
      issuerCode: "spain",
      rulerCode: undefined,
      themeCode: undefined,
    })
  })
})
