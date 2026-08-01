import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { EdgeMaintenanceRouteComponent } from "./edge-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("EdgeMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <EdgeMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Edges table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <EdgeMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          edges: [
            {
              id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
              code: "reeded",
              name: "Reeded",
              createdAt: new Date("2026-06-24T12:00:00.000Z"),
              updatedAt: new Date("2026-06-24T12:00:00.000Z"),
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Edge Code")
    expect(markup).toContain("Edge Name")
    expect(markup).toContain("Reeded")
  })
})
