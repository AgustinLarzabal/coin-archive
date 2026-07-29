import type { CompositionOption } from "@coin-archive/db"
import { describe, expect, it } from "vitest"

import { hasCompositionEditChanges } from "./composition-edit-form"

const composition: CompositionOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "silver-900",
  name: "Silver (.900)",
  description: "Ninety percent silver alloy.",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

describe("hasCompositionEditChanges", () => {
  it("returns false when trimmed editable values match the current Composition", () => {
    expect(
      hasCompositionEditChanges(composition, {
        code: " silver-900 ",
        name: " Silver (.900) ",
        description: "  Ninety percent silver alloy.  ",
      })
    ).toBe(false)
  })

  it("treats blank or whitespace-only Composition Description as unchanged when the current value is empty", () => {
    expect(
      hasCompositionEditChanges(
        {
          ...composition,
          description: null,
        },
        {
          code: "silver-900",
          name: "Silver (.900)",
          description: "   ",
        }
      )
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasCompositionEditChanges(composition, {
        code: "silver-925",
        name: "Silver (.925)",
        description: "Sterling silver alloy.",
      })
    ).toBe(true)
  })
})
