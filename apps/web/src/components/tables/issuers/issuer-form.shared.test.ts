import type { IssuerMaintenanceRecord } from "@workspace/db"
import { describe, expect, it } from "vitest"

import {
  createIssuerDraft,
  getParentIssuerOptions,
  INVALID_PARENT_ISSUER_SELECTION,
  isIssuerDraftComplete,
  normalizeIssuerDraft,
  resolveParentIssuerId,
} from "./issuer-form.shared"

const issuers: IssuerMaintenanceRecord[] = [
  {
    id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    parent: null,
  },
  {
    id: "4ffdfab6-989a-4378-ba8c-3610de04b3ef",
    code: "provincia-de-la-rioja",
    isoCode: "AR",
    name: "Provincia de La Rioja",
    parent: {
      id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
      code: "argentine-republic",
      name: "Argentine Republic",
    },
  },
  {
    id: "8dc1babc-c469-427d-9cee-559320c14eef",
    code: "chilecito",
    isoCode: "AR",
    name: "Chilecito",
    parent: {
      id: "4ffdfab6-989a-4378-ba8c-3610de04b3ef",
      code: "provincia-de-la-rioja",
      name: "Provincia de La Rioja",
    },
  },
]

describe("normalizeIssuerDraft", () => {
  it("trims editable fields and uppercases the ISO code", () => {
    expect(
      normalizeIssuerDraft({
        code: " argentine-republic ",
        isoCode: " ar ",
        name: " Argentine Republic ",
        parentIssuerLabel: " Argentine Republic (argentine-republic) ",
      })
    ).toStrictEqual({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
      parentIssuerLabel: "Argentine Republic (argentine-republic)",
    })
  })
})

describe("isIssuerDraftComplete", () => {
  it("requires code, ISO code, and name but not a Parent Issuer", () => {
    expect(
      isIssuerDraftComplete({
        code: " issuer ",
        isoCode: " ar ",
        name: " Issuer ",
        parentIssuerLabel: "",
      })
    ).toBe(true)

    expect(
      isIssuerDraftComplete({
        code: "issuer",
        isoCode: "",
        name: "Issuer",
        parentIssuerLabel: "",
      })
    ).toBe(false)
  })
})

describe("getParentIssuerOptions", () => {
  it("builds flat searchable labels with parent context", () => {
    expect(getParentIssuerOptions(issuers)).toStrictEqual([
      {
        id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
        label: "Argentine Republic (argentine-republic)",
      },
      {
        id: "4ffdfab6-989a-4378-ba8c-3610de04b3ef",
        label:
          "Provincia de La Rioja (provincia-de-la-rioja) > Argentine Republic (argentine-republic)",
      },
      {
        id: "8dc1babc-c469-427d-9cee-559320c14eef",
        label:
          "Chilecito (chilecito) > Provincia de La Rioja (provincia-de-la-rioja) > Argentine Republic (argentine-republic)",
      },
    ])
  })

  it("excludes the current Issuer and its descendants from the available parents", () => {
    expect(
      getParentIssuerOptions(issuers, "4ffdfab6-989a-4378-ba8c-3610de04b3ef")
    ).toStrictEqual([
      {
        id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
        label: "Argentine Republic (argentine-republic)",
      },
    ])
  })
})

describe("createIssuerDraft", () => {
  it("hydrates the existing Parent Issuer label for edit mode", () => {
    expect(createIssuerDraft(issuers[1], issuers)).toStrictEqual({
      code: "provincia-de-la-rioja",
      isoCode: "AR",
      name: "Provincia de La Rioja",
      parentIssuerLabel: "Argentine Republic (argentine-republic)",
    })
  })
})

describe("resolveParentIssuerId", () => {
  const options = getParentIssuerOptions(issuers)

  it("returns null for a blank Parent Issuer selection", () => {
    expect(resolveParentIssuerId(" ", options)).toBeNull()
  })

  it("maps an exact label match back to the selected Parent Issuer id", () => {
    expect(
      resolveParentIssuerId("Argentine Republic (argentine-republic)", options)
    ).toBe("dc2f4da3-cfd0-43fa-8900-7a384fc6977a")
  })

  it("flags free-typed labels that do not match an available Parent Issuer", () => {
    expect(resolveParentIssuerId("Unknown Issuer", options)).toBe(
      INVALID_PARENT_ISSUER_SELECTION
    )
  })
})
