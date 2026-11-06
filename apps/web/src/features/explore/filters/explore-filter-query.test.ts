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
  })
  expect(filterQueryToPatch(query("ROMAN"), { issuer: "AR" })).toMatchObject({
    issuer: "ROMAN",
  })
  expect(filterQueryToPatch(query(), { issuer: "AR" })).toMatchObject({
    issuer: undefined,
  })
  expect(filterQueryToPatch(query("AR"), { issuer: "AR" })).toEqual({})
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
