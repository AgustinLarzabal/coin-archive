import { renderToStaticMarkup } from "react-dom/server"
import type { TechniqueOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"

import { MINTING_TECHNIQUE_AUTHORIZATION_ERROR } from "./actions"
import {
  loadMintingTechniqueMaintenanceMintingTechniques,
  renderMintingTechniqueMaintenancePage,
} from "./minting-technique-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock(
  "./sheet-workflow/minting-technique-maintenance-sheet",
  () => ({
    MintingTechniqueMaintenanceSheet: () => null,
  })
)

const mintingTechniqueTimestamps = {
  createdAt: new Date("2026-07-02T00:00:00.000Z"),
  updatedAt: new Date("2026-07-02T00:00:00.000Z"),
} as const

function createMintingTechnique(
  overrides: Pick<TechniqueOption, "id" | "code" | "name">
): TechniqueOption {
  return {
    ...mintingTechniqueTimestamps,
    ...overrides,
  }
}

describe("loadMintingTechniqueMaintenanceMintingTechniques", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getTechniques = vi.fn()

    await expect(
      loadMintingTechniqueMaintenanceMintingTechniques(null, { getTechniques })
    ).resolves.toStrictEqual({
      status: "error",
      formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
    })

    expect(getTechniques).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getTechniques = vi.fn()

    await expect(
      loadMintingTechniqueMaintenanceMintingTechniques(
        { role: "collector" },
        { getTechniques }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
    })

    expect(getTechniques).not.toHaveBeenCalled()
  })

  it("returns Minting Techniques for Editors and Admins", async () => {
    const mintingTechniques = [
      createMintingTechnique({
        id: "f45b35fd-a6df-4255-adc5-005d7eb06251",
        code: "hammered",
        name: "Hammered",
      }),
    ]
    const getTechniques = vi.fn().mockResolvedValue(mintingTechniques)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadMintingTechniqueMaintenanceMintingTechniques(
          { role },
          { getTechniques }
        )
      ).resolves.toStrictEqual({
        status: "success",
        mintingTechniques,
      })
    }
  })
})

describe("renderMintingTechniqueMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderMintingTechniqueMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Minting Techniques table for allowed Editors and Admins with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderMintingTechniqueMaintenancePage({
        isAllowed: true,
        mintingTechniques: [
          createMintingTechnique({
            id: "f45b35fd-a6df-4255-adc5-005d7eb06251",
            code: "hammered",
            name: "Hammered",
          }),
          createMintingTechnique({
            id: "1484fbeb-4dbc-45e4-860f-cbf1d7bd54db",
            code: "machine-struck",
            name: "Machine struck",
          }),
        ],
      })
    )

    expect(markup).toContain("Minting Technique Code")
    expect(markup).toContain("Minting Technique Name")
    expect(markup).toContain("Hammered")
    expect(markup).toContain("Machine struck")
    expect(markup).toContain("Filter minting techniques by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
