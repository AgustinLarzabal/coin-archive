import {
  createFilterQuery,
  createFilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-query"
import { expect, it } from "vitest"

import { getExploreFilterFields } from "./explore-filter-definitions"

it("keeps unavailable selections visible and disables selected fields", () => {
  const query = createFilterQuery([
    createFilterRule({
      id: "explore-mint",
      path: ["mint"],
      operator: "is",
      value: "old-mint",
    }),
  ])
  const fields = getExploreFilterFields(
    {
      currencies: [],
      compositions: [],
      shapes: [],
      distributions: [],
      engravers: [],
      issuers: [],
      mints: [],
      rulingAuthorities: [],
      tags: [],
    },
    { engraver: "old-engraver", mint: "old-mint" },
    query
  )

  expect(fields.find(({ id }) => id === "mint")).toMatchObject({
    disabled: true,
    type: "select",
    pinSelected: true,
    operators: [{ value: "is", label: "is" }],
    options: [
      { label: "Unknown Mint (old-mint)", value: "old-mint", disabled: true },
    ],
  })
  expect(fields.find(({ id }) => id === "engraver")).toMatchObject({
    disabled: false,
    options: [
      {
        label: "Unknown engraver (old-engraver)",
        value: "old-engraver",
        disabled: true,
      },
    ],
  })
  expect(fields.find(({ id }) => id === "shape")).toMatchObject({
    type: "select",
    options: [],
  })
  expect(fields.find(({ id }) => id === "amount")).toMatchObject({
    type: "text",
    disabled: true,
    description: "Choose a currency first",
    operators: [{ value: "eq", label: "equals" }],
  })
  expect(fields.find(({ id }) => id === "year")).toMatchObject({
    type: "number",
    operators: [
      { value: "eq", label: "equals" },
      { value: "between", label: "is between", arity: "range" },
    ],
  })
  expect(fields.find(({ id }) => id === "size")).toMatchObject({
    type: "number",
    label: "Size (mm)",
    operators: [
      { value: "eq", label: "equals" },
      { value: "between", label: "is between", arity: "range" },
    ],
  })
  expect(fields.find(({ id }) => id === "thickness")).toMatchObject({
    type: "number",
    label: "Thickness (mm)",
    operators: [
      { value: "eq", label: "equals" },
      { value: "between", label: "is between", arity: "range" },
    ],
  })
  expect(fields.find(({ id }) => id === "weight")).toMatchObject({
    type: "number",
    label: "Weight (g)",
    operators: [
      { value: "eq", label: "equals" },
      { value: "between", label: "is between", arity: "range" },
    ],
  })
})

it("enables Face Value Amount after selecting Currency", () => {
  const fields = getExploreFilterFields(
    {
      currencies: [],
      compositions: [],
      shapes: [],
      distributions: [],
      engravers: [],
      issuers: [],
      mints: [],
      rulingAuthorities: [],
      tags: [],
    },
    { currency: "euro" },
    createFilterQuery<string>([
      createFilterRule({
        id: "currency",
        path: ["currency"],
        operator: "is",
        value: "euro",
      }),
    ])
  )
  expect(fields.find(({ id }) => id === "amount")).toMatchObject({
    disabled: false,
    description: undefined,
  })
})

it("keeps Face Value Amount unavailable while Currency is unfinished", () => {
  const fields = getExploreFilterFields(
    {
      currencies: [],
      compositions: [],
      shapes: [],
      distributions: [],
      engravers: [],
      issuers: [],
      mints: [],
      rulingAuthorities: [],
      tags: [],
    },
    {},
    createFilterQuery<string>([
      createFilterRule({
        id: "currency",
        path: ["currency"],
        operator: "is",
        value: undefined,
      }),
    ])
  )
  expect(fields.find(({ id }) => id === "amount")).toMatchObject({
    disabled: true,
  })
})

it("offers Map from the Tag catalogue", () => {
  const fields = getExploreFilterFields(
    {
      currencies: [],
      compositions: [],
      shapes: [],
      distributions: [],
      engravers: [],
      issuers: [],
      mints: [],
      rulingAuthorities: [],
      tags: [{ slug: "map", name: "Map" }],
    },
    {},
    createFilterQuery()
  )
  expect(fields.find(({ id }) => id === "tag")).toMatchObject({
    type: "select",
    options: [{ label: "Map", value: "map" }],
  })
})

it("offers Shapes supplied by the catalogue even without matching Coins", () => {
  const fields = getExploreFilterFields(
    {
      currencies: [],
      compositions: [],
      distributions: [],
      engravers: [],
      issuers: [],
      mints: [],
      rulingAuthorities: [],
      tags: [],
      shapes: [{ slug: "pentagonal", name: "Pentagonal" }],
    },
    {},
    createFilterQuery()
  )
  expect(fields.find(({ id }) => id === "shape")).toMatchObject({
    options: [{ label: "Pentagonal", value: "pentagonal" }],
  })
})
