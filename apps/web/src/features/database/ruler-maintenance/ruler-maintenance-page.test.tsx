import { renderToStaticMarkup } from "react-dom/server"
import type { RulerOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { RulerMaintenanceRouteComponent } from "./ruler-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

function createRuler(
  overrides: Pick<RulerOption, "id" | "code" | "name" | "group">
): RulerOption {
  return overrides
}

describe("RulerMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <RulerMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Rulers table for allowed Editors and Admins with group details and maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <RulerMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          rulerGroups: [
            {
              id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
              code: "house-of-bourbon",
              name: "House of Bourbon",
            },
          ],
          rulers: [
            createRuler({
              id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
              code: "felipe-v",
              name: "Felipe V",
              group: {
                id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
                code: "house-of-bourbon",
                name: "House of Bourbon",
              },
            }),
            createRuler({
              id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
              code: "liberty",
              name: "Liberty",
              group: null,
            }),
          ],
        }}
      />
    )

    expect(markup).toContain("Ruler Code")
    expect(markup).toContain("Ruler Name")
    expect(markup).toContain("Ruler Group")
    expect(markup).toContain("Felipe V")
    expect(markup).toContain("House of Bourbon (house-of-bourbon)")
    expect(markup).toContain("Liberty")
    expect(markup).toContain("No Ruler Group")
    expect(markup).toContain("Filter rulers by code, name, or ruler group...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
