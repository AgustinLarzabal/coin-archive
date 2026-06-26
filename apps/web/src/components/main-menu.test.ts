import { describe, expect, it } from "vitest"

import { getPrivateNavigationItem } from "./main-menu"

describe("getPrivateNavigationItem", () => {
  it("includes Currencies in the Database main navigation children", () => {
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
      ],
    })
  })
})
