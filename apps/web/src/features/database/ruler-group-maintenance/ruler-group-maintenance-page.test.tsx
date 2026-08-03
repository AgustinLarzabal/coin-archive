import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { RulerGroupMaintenanceRouteComponent } from "./ruler-group-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("RulerGroupMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <RulerGroupMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Ruler Groups table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <RulerGroupMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          rulerGroups: [
            {
              id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
              code: "reeded",
              name: "Reeded",
              version: 1,
              etag: '"ruler-group-version-1"',
              createdAt: "2026-06-24T12:00:00.000Z",
              updatedAt: "2026-06-24T12:00:00.000Z",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Ruler Group Code")
    expect(markup).toContain("Ruler Group Name")
    expect(markup).toContain("Reeded")
  })
})
