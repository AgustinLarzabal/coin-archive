import { describe, expect, it } from "vitest"

import { getPrivateNavigationItem } from "./main-menu"

describe("getPrivateNavigationItem", () => {
  it("includes Minting Techniques in the Database main navigation children after Shapes", () => {
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
        { to: "/database/rims", label: "Rims" },
        { to: "/database/shapes", label: "Shapes" },
        {
          to: "/database/minting-techniques",
          label: "Minting Techniques",
        },
        { to: "/database/engravers", label: "Engravers" },
        { to: "/database/issuers", label: "Issuers" },
        { to: "/database/rulers", label: "Rulers" },
        { to: "/database/ruler-groups", label: "Ruler Groups" },
        { to: "/database/orientations", label: "Orientations" },
        { to: "/database/mints", label: "Mints" },
      ],
    })
  })
})
