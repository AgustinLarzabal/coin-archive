import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { EngraverMaintenanceRouteComponent } from "./engraver-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("EngraverMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <EngraverMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Engravers table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <EngraverMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          engravers: [
            {
              id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
              code: "reeded",
              name: "Reeded",
              version: 1,
              etag: '"engraver-version-1"',
              createdAt: "2026-06-24T12:00:00.000Z",
              updatedAt: "2026-06-24T12:00:00.000Z",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Engraver Code")
    expect(markup).toContain("Engraver Name")
    expect(markup).toContain("Reeded")
  })
})
