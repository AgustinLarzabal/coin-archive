import { describe, expect, it } from "vitest"

import { databaseSecondaryMenuItems } from "./-navigation-items"

describe("databaseSecondaryMenuItems", () => {
  it("includes the Issuers maintenance entry after Themes", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/issuers",
      label: "Issuers",
    })

    expect(databaseSecondaryMenuItems[9]).toStrictEqual({
      to: "/database/engravers",
      label: "Engravers",
    })
    expect(databaseSecondaryMenuItems[10]).toStrictEqual({
      to: "/database/themes",
      label: "Themes",
    })
    expect(databaseSecondaryMenuItems[11]).toStrictEqual({
      to: "/database/issuers",
      label: "Issuers",
    })
  })
})
