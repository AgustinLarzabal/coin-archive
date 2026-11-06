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
      distributions: [],
      engravers: [],
      issuers: [],
      mints: [],
      rulingAuthorities: [],
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
})
