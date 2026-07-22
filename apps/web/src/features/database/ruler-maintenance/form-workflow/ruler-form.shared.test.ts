import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { describe, expect, it } from "vitest"

import {
  buildRulerGroupOptionLabel,
  createRulerDraft,
  getCreateRulerSubmission,
  getRulerGroupSelectionOptions,
  getUpdateRulerSubmission,
  INVALID_RULER_GROUP_ERROR,
  INVALID_RULER_GROUP_SELECTION,
  isRulerDraftComplete,
  normalizeRulerDraft,
  resolveRulerGroupId,
} from "./ruler-form.shared"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "de2dcfb7-dc50-4035-8bc8-33cbbacb586b",
    code: "julio-claudians",
    name: "Julio-Claudians",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

const ruler: RulerOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "felipe-v",
  name: "Felipe V",
  group: {
    id: rulerGroups[0].id,
    code: rulerGroups[0].code,
    name: rulerGroups[0].name,
  },
}

describe("buildRulerGroupOptionLabel", () => {
  it("includes both Ruler Group name and code", () => {
    expect(buildRulerGroupOptionLabel(rulerGroups[0])).toBe(
      "House of Bourbon (house-of-bourbon)"
    )
  })
})

describe("createRulerDraft", () => {
  it("hydrates the current Ruler Group label for edit mode", () => {
    expect(createRulerDraft(ruler)).toStrictEqual({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupLabel: "House of Bourbon (house-of-bourbon)",
    })
  })
})

describe("normalizeRulerDraft", () => {
  it("trims editable Ruler fields", () => {
    expect(
      normalizeRulerDraft({
        code: " felipe-v ",
        name: " Felipe V ",
        rulerGroupLabel: " House of Bourbon (house-of-bourbon) ",
      })
    ).toStrictEqual({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupLabel: "House of Bourbon (house-of-bourbon)",
    })
  })
})

describe("isRulerDraftComplete", () => {
  it("requires code and name but not a Ruler Group selection", () => {
    expect(
      isRulerDraftComplete({
        code: " felipe-v ",
        name: " Felipe V ",
        rulerGroupLabel: "",
      })
    ).toBe(true)

    expect(
      isRulerDraftComplete({
        code: "felipe-v",
        name: " ",
        rulerGroupLabel: "",
      })
    ).toBe(false)
  })
})

describe("getRulerGroupSelectionOptions", () => {
  it("builds flat labels for the Ruler Group datalist", () => {
    expect(getRulerGroupSelectionOptions(rulerGroups)).toStrictEqual([
      {
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
        label: "House of Bourbon (house-of-bourbon)",
      },
      {
        id: "de2dcfb7-dc50-4035-8bc8-33cbbacb586b",
        label: "Julio-Claudians (julio-claudians)",
      },
    ])
  })
})

describe("resolveRulerGroupId", () => {
  const options = getRulerGroupSelectionOptions(rulerGroups)

  it("returns null for a blank Ruler Group selection", () => {
    expect(resolveRulerGroupId(" ", options)).toBeNull()
  })

  it("maps an exact label match back to the selected Ruler Group id", () => {
    expect(
      resolveRulerGroupId("House of Bourbon (house-of-bourbon)", options)
    ).toBe("6f18a1db-9096-433b-b3f1-906c772f7a29")
  })

  it("flags free-typed labels that do not match an available Ruler Group", () => {
    expect(resolveRulerGroupId("Unknown Group", options)).toBe(
      INVALID_RULER_GROUP_SELECTION
    )
  })
})

describe("getCreateRulerSubmission", () => {
  it("normalizes draft values and resolves the selected Ruler Group", () => {
    expect(
      getCreateRulerSubmission(
        {
          code: " felipe-v ",
          name: " Felipe V ",
          rulerGroupLabel: " House of Bourbon (house-of-bourbon) ",
        },
        rulerGroups
      )
    ).toStrictEqual({
      status: "valid",
      data: {
        code: "felipe-v",
        name: "Felipe V",
        rulerGroupId: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      },
    })
  })

  it("allows clearing the optional Ruler Group selection", () => {
    expect(
      getCreateRulerSubmission(
        {
          code: "liberty",
          name: "Liberty",
          rulerGroupLabel: " ",
        },
        rulerGroups
      )
    ).toStrictEqual({
      status: "valid",
      data: {
        code: "liberty",
        name: "Liberty",
        rulerGroupId: null,
      },
    })
  })

  it("rejects non-matching Ruler Group labels with a field error", () => {
    expect(
      getCreateRulerSubmission(
        {
          code: "felipe-v",
          name: "Felipe V",
          rulerGroupLabel: "Unknown Group",
        },
        rulerGroups
      )
    ).toStrictEqual({
      status: "invalid",
      result: {
        status: "error",
        fieldErrors: {
          rulerGroupId: INVALID_RULER_GROUP_ERROR,
        },
      },
    })
  })
})

describe("getUpdateRulerSubmission", () => {
  it("preserves the Ruler id and allows changing the Ruler Group selection", () => {
    expect(
      getUpdateRulerSubmission(
        ruler.id,
        {
          code: " felipe-v ",
          name: " Felipe V ",
          rulerGroupLabel: " Julio-Claudians (julio-claudians) ",
        },
        rulerGroups
      )
    ).toStrictEqual({
      status: "valid",
      data: {
        id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
        code: "felipe-v",
        name: "Felipe V",
        rulerGroupId: "de2dcfb7-dc50-4035-8bc8-33cbbacb586b",
      },
    })
  })
})
