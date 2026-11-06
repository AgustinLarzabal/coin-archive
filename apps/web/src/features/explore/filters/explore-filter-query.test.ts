import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { expect, it } from "vitest"

import { filterQueryToPatch, searchToFilterQuery } from "./explore-filter-query"

it("turns URL filters into filter rules without including the page", () => {
  expect(
    searchToFilterQuery({ issuer: "AR", mint: "buenos-aires", page: 3 })
  ).toEqual(
    createFilterQuery([
      createFilterRule({
        id: "explore-issuer",
        path: ["issuer"],
        operator: "is",
        value: "AR",
      }),
      createFilterRule({
        id: "explore-mint",
        path: ["mint"],
        operator: "is",
        value: "buenos-aires",
      }),
    ])
  )
})

it("turns added, replaced, and cleared rules into URL patches", () => {
  const query = (issuer?: string) =>
    createFilterQuery(
      issuer === undefined
        ? []
        : [
            createFilterRule({
              id: "explore-issuer",
              path: ["issuer"],
              operator: "is",
              value: issuer,
            }),
          ]
    )

  expect(filterQueryToPatch(query("AR"), {})).toEqual({
    currency: undefined,
    distribution: undefined,
    engraver: undefined,
    issuer: "AR",
    mint: undefined,
    ruler: undefined,
    size: undefined,
    year: undefined,
  })
  expect(filterQueryToPatch(query("ROMAN"), { issuer: "AR" })).toMatchObject({
    issuer: "ROMAN",
  })
  expect(filterQueryToPatch(query(), { issuer: "AR" })).toMatchObject({
    issuer: undefined,
  })
  expect(filterQueryToPatch(query("AR"), { issuer: "AR" })).toEqual({})
})

it("round-trips an issue year and a BCE-to-CE range", () => {
  for (const [year, operator, value] of [
    [1986, "eq", 1986],
    ["-25-19", "between", [-25, 19]],
  ] as const) {
    const query = searchToFilterQuery({ year })
    expect(query.rules).toMatchObject([{ path: ["year"], operator, value }])
    expect(filterQueryToPatch(query, { year })).toEqual({})
    expect(filterQueryToPatch(query, {})).toMatchObject({ year })
  }
})

it("round-trips exact and ranged sizes", () => {
  for (const [size, operator, value] of [
    ["25.75", "eq", 25.75],
    ["20-30", "between", [20, 30]],
  ] as const) {
    const query = searchToFilterQuery({ size })
    expect(query.rules).toMatchObject([{ path: ["size"], operator, value }])
    expect(filterQueryToPatch(query, { size })).toEqual({})
    expect(filterQueryToPatch(query, {})).toMatchObject({ size })
  }
})

it("keeps incomplete size ranges local and rejects invalid sizes", () => {
  const rule = (
    operator: string,
    value: number | [number | undefined, number | undefined]
  ) =>
    createFilterQuery([
      createFilterRule({ id: "test-size", path: ["size"], operator, value }),
    ])

  expect(filterQueryToPatch(rule("between", [20, undefined]), {})).toEqual({})
  expect(filterQueryToPatch(rule("eq", 0), {})).toBeNull()
  expect(filterQueryToPatch(rule("eq", 20.001), {})).toBeNull()
  expect(filterQueryToPatch(rule("between", [30, 20]), {})).toBeNull()
  expect(filterQueryToPatch(rule("gte", 20), {})).toBeNull()
})

it("keeps incomplete ranges local and rejects invalid years", () => {
  const rule = (
    operator: string,
    value: number | [number | undefined, number | undefined]
  ) =>
    createFilterQuery([
      createFilterRule({ id: "test-year", path: ["year"], operator, value }),
    ])

  expect(filterQueryToPatch(rule("between", [1986, undefined]), {})).toEqual({})
  expect(
    filterQueryToPatch(
      createFilterQuery<number>([
        createFilterRule({
          id: "pending-year",
          path: ["year"],
          operator: "",
          value: undefined,
        }),
      ]),
      {}
    )
  ).toEqual({})
  expect(filterQueryToPatch(rule("eq", 0), {})).toBeNull()
  expect(filterQueryToPatch(rule("eq", 1986.5), {})).toBeNull()
  expect(filterQueryToPatch(rule("between", [1990, 1986]), {})).toBeNull()
  expect(filterQueryToPatch(rule("between", [0, 1986]), {})).toBeNull()
})

it("keeps a new rule local until its value is selected", () => {
  const pending = createFilterQuery<string>([
    createFilterRule({
      id: "pending-issuer",
      path: ["issuer"],
      operator: "is",
      value: undefined,
    }),
  ])

  expect(filterQueryToPatch(pending, {})).toEqual({})
  expect(filterQueryToPatch(pending, { issuer: "AR" })).toEqual({})
})
