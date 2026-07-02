import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { describe, expect, it } from "vitest"

import {
  createRulerDraft,
  formatRulerGroupOptionLabel,
  getCreateRulerSubmission,
  getRulerGroupSelectionOptions,
  getUpdateRulerSubmission,
  INVALID_RULER_GROUP_ERROR,
  INVALID_RULER_GROUP_SELECTION,
  isRulerDraftComplete,
  normalizeRulerDraft,
  resolveRulerGroupId,
} from "./ruler-form.shared"

const bourbonGroup: RulerGroupOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "house-of-bourbon",
  name: "House of Bourbon",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

const julioClaudianGroup: RulerGroupOption = {
  id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
  code: "julio-claudians",
  name: "Julio-Claudians",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

const rulerGroups = [bourbonGroup, julioClaudianGroup]

const ruler: RulerOption = {
  id: "49593601-9276-4761-a03b-f5e43cf674fd",
  code: "louis-xiv",
  name: "Louis XIV",
  group: {
    id: bourbonGroup.id,
    code: bourbonGroup.code,
    name: bourbonGroup.name,
  },
}

describe("formatRulerGroupOptionLabel", () => {
  it("shows the Ruler Group name and code for disambiguation", () => {
    expect(formatRulerGroupOptionLabel(bourbonGroup)).toBe(
      "House of Bourbon (house-of-bourbon)"
    )
  })
})

describe("createRulerDraft", () => {
  it("copies the editable Ruler fields from a selected Ruler", () => {
    expect(createRulerDraft(ruler)).toStrictEqual({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupLabel: "House of Bourbon (house-of-bourbon)",
    })
  })

  it("uses a blank Ruler Group label when the Ruler has no group", () => {
    expect(
      createRulerDraft({
        ...ruler,
        group: null,
      })
    ).toStrictEqual({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupLabel: "",
    })
  })
})

describe("normalizeRulerDraft", () => {
  it("trims editable Ruler fields", () => {
    expect(
      normalizeRulerDraft({
        code: " louis-xiv ",
        name: " Louis XIV ",
        rulerGroupLabel: " House of Bourbon (house-of-bourbon) ",
      })
    ).toStrictEqual({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupLabel: "House of Bourbon (house-of-bourbon)",
    })
  })
})

describe("isRulerDraftComplete", () => {
  it("requires non-blank Ruler Code and Ruler Name but allows no Ruler Group", () => {
    expect(
      isRulerDraftComplete({
        code: "louis-xiv",
        name: " ",
        rulerGroupLabel: "",
      })
    ).toBe(false)

    expect(
      isRulerDraftComplete({
        code: " ",
        name: "Louis XIV",
        rulerGroupLabel: "",
      })
    ).toBe(false)

    expect(
      isRulerDraftComplete({
        code: " louis-xiv ",
        name: " Louis XIV ",
        rulerGroupLabel: " ",
      })
    ).toBe(true)
  })
})

describe("getRulerGroupSelectionOptions", () => {
  it("builds exact-match selector options from existing Ruler Groups", () => {
    expect(getRulerGroupSelectionOptions(rulerGroups)).toStrictEqual([
      {
        id: bourbonGroup.id,
        label: "House of Bourbon (house-of-bourbon)",
      },
      {
        id: julioClaudianGroup.id,
        label: "Julio-Claudians (julio-claudians)",
      },
    ])
  })
})

describe("resolveRulerGroupId", () => {
  const options = getRulerGroupSelectionOptions(rulerGroups)

  it("returns the matching Ruler Group id only for an exact option label", () => {
    expect(
      resolveRulerGroupId("House of Bourbon (house-of-bourbon)", options)
    ).toBe(bourbonGroup.id)
    expect(resolveRulerGroupId("House of Bourbon", options)).toBe(
      INVALID_RULER_GROUP_SELECTION
    )
  })

  it("treats blank selector text as clearing the optional Ruler Group assignment", () => {
    expect(resolveRulerGroupId(" ", options)).toBeNull()
  })
})

describe("getCreateRulerSubmission", () => {
  it("returns a typed field error when the Ruler Group selector text does not match an option", () => {
    expect(
      getCreateRulerSubmission(
        {
          code: "louis-xiv",
          name: "Louis XIV",
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

  it("maps an empty Ruler Group label to no optional group assignment", () => {
    expect(
      getCreateRulerSubmission(
        {
          code: " louis-xiv ",
          name: " Louis XIV ",
          rulerGroupLabel: " ",
        },
        rulerGroups
      )
    ).toStrictEqual({
      status: "valid",
      data: {
        code: "louis-xiv",
        name: "Louis XIV",
        rulerGroupId: null,
      },
    })
  })
})

describe("getUpdateRulerSubmission", () => {
  it("returns a valid submission with the matched Ruler Group id", () => {
    expect(
      getUpdateRulerSubmission(
        ruler.id,
        {
          code: " louis-xiv ",
          name: " Louis XIV ",
          rulerGroupLabel: "Julio-Claudians (julio-claudians)",
        },
        rulerGroups
      )
    ).toStrictEqual({
      status: "valid",
      data: {
        id: ruler.id,
        code: "louis-xiv",
        name: "Louis XIV",
        rulerGroupId: julioClaudianGroup.id,
      },
    })
  })
})
