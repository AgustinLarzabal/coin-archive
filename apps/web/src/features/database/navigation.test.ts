import { describe, expect, it } from "vitest"

import {
  databaseMaintenanceSections,
  databaseSecondaryMenuItems,
} from "./navigation"

describe("database navigation", () => {
  it("keeps the existing database menu labels, ordering, routes, and count keys", () => {
    expect(databaseMaintenanceSections).toStrictEqual([
      {
        to: "/database/coins",
        label: "Coins",
        countKey: "coins",
      },
      {
        to: "/database/catalogues",
        label: "Catalogues",
        countKey: "catalogues",
      },
      {
        to: "/database/compositions",
        label: "Compositions",
        countKey: "compositions",
      },
      {
        to: "/database/currencies",
        label: "Currencies",
        countKey: "currencies",
      },
      {
        to: "/database/distributions",
        label: "Distributions",
        countKey: "distributions",
      },
      {
        to: "/database/edges",
        label: "Edges",
        countKey: "edges",
      },
      {
        to: "/database/rims",
        label: "Rims",
        countKey: "rims",
      },
      {
        to: "/database/shapes",
        label: "Shapes",
        countKey: "shapes",
      },
      {
        to: "/database/minting-techniques",
        label: "Minting Techniques",
        countKey: "mintingTechniques",
      },
      {
        to: "/database/engravers",
        label: "Engravers",
        countKey: "engravers",
      },
      {
        to: "/database/themes",
        label: "Themes",
        countKey: "themes",
      },
      {
        to: "/database/issuers",
        label: "Issuers",
        countKey: "issuers",
      },
      {
        to: "/database/rulers",
        label: "Rulers",
        countKey: "rulers",
      },
      {
        to: "/database/ruler-groups",
        label: "Ruler Groups",
        countKey: "rulerGroups",
      },
      {
        to: "/database/orientations",
        label: "Orientations",
        countKey: "orientations",
      },
      {
        to: "/database/mints",
        label: "Mints",
        countKey: "mints",
      },
    ])

    expect(databaseSecondaryMenuItems).toStrictEqual([
      {
        to: "/database",
        label: "General",
      },
      ...databaseMaintenanceSections.map(({ to, label }) => ({ to, label })),
    ])
  })
})
