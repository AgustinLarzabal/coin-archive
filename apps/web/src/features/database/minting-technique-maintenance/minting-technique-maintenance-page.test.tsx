import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { MintingTechniqueMaintenanceRouteComponent } from "./minting-technique-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("MintingTechniqueMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <MintingTechniqueMaintenanceRouteComponent
        loaderData={{ isAllowed: false }}
      />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Minting Techniques table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <MintingTechniqueMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          mintingTechniques: [
            {
              id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
              code: "reeded",
              name: "Reeded",
              version: 1,
              etag: '"minting-technique-version-1"',
              createdAt: "2026-06-24T12:00:00.000Z",
              updatedAt: "2026-06-24T12:00:00.000Z",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Minting Technique Code")
    expect(markup).toContain("Minting Technique Name")
    expect(markup).toContain("Reeded")
  })
})
