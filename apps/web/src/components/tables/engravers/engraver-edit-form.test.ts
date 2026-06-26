import type { EngraverOption } from "@workspace/db"
import { describe, expect, it } from "vitest"

import { hasEngraverEditChanges } from "./engraver-edit-form"

const engraver: EngraverOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "barth",
  name: "Barth",
}

describe("hasEngraverEditChanges", () => {
  it("returns false when trimmed editable values match the current Engraver", () => {
    expect(
      hasEngraverEditChanges(engraver, {
        code: " barth ",
        name: " Barth ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasEngraverEditChanges(engraver, {
        code: "durand",
        name: "Durand",
      })
    ).toBe(true)
  })
})
