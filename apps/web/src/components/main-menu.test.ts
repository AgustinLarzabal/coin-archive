import { describe, expect, it } from "vitest"

import { getPrivateNavigationItem } from "./main-menu"

describe("getPrivateNavigationItem", () => {
  it("includes Mints in the Database main navigation children after Issuers", () => {
    expect(
      getPrivateNavigationItem({
        to: "/database",
        label: "Database",
      })
    ).toStrictEqual({
      to: "/database",
      label: "Database",
      children: [
        { to: "/database", label: "General" },
        { to: "/database/catalogues", label: "Catalogues" },
        { to: "/database/compositions", label: "Compositions" },
        { to: "/database/currencies", label: "Currencies" },
        { to: "/database/distributions", label: "Distributions" },
        { to: "/database/edges", label: "Edges" },
        { to: "/database/engravers", label: "Engravers" },
        { to: "/database/issuers", label: "Issuers" },
        { to: "/database/mints", label: "Mints" },
      ],
    })
  })
})
