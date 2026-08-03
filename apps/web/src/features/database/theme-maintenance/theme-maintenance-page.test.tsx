import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ThemeMaintenanceRouteComponent } from "./theme-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("ThemeMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <ThemeMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Themes table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <ThemeMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          themes: [
            {
              id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
              code: "reeded",
              name: "Reeded",
              version: 1,
              etag: '"theme-version-1"',
              createdAt: "2026-06-24T12:00:00.000Z",
              updatedAt: "2026-06-24T12:00:00.000Z",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Theme Code")
    expect(markup).toContain("Theme Name")
    expect(markup).toContain("Reeded")
  })
})
