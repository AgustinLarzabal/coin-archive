import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { RimMaintenanceRouteComponent } from "./rim-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("RimMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <RimMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Rims table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <RimMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          rims: [
            {
              id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
              code: "reeded",
              name: "Reeded",
              version: 1,
              etag: '"rim-version-1"',
              createdAt: "2026-06-24T12:00:00.000Z",
              updatedAt: "2026-06-24T12:00:00.000Z",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Rim Code")
    expect(markup).toContain("Rim Name")
    expect(markup).toContain("Reeded")
  })
})
