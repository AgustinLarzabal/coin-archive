import { describe, expect, it } from "vitest"

import { databaseSecondaryMenuItems } from "./-navigation-items"

describe("databaseSecondaryMenuItems", () => {
  it("includes the Issuers maintenance entry after Engravers", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/issuers",
      label: "Issuers",
    })

    expect(databaseSecondaryMenuItems[6]).toStrictEqual({
      to: "/database/engravers",
      label: "Engravers",
    })
    expect(databaseSecondaryMenuItems[7]).toStrictEqual({
      to: "/database/issuers",
      label: "Issuers",
    })
  })
})
