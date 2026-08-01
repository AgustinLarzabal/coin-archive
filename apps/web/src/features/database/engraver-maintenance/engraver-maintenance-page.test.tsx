import { renderToStaticMarkup } from "react-dom/server"
import type { EngraverOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { EngraverMaintenanceRouteComponent } from "./engraver-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/engravers-table", () => ({
  EngraversTable: ({ engravers }: { engravers: EngraverOption[] }) =>
    `Engravers table: ${engravers.map((engraver) => engraver.name).join(", ")}`,
}))

describe("EngraverMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <EngraverMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Engraver maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <EngraverMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          engravers: [
            {
              id: "2816420d-cde4-4984-b5af-2aa4c5d2720d",
              code: "barth",
              name: "Barth",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Engravers table:")
    expect(markup).toContain("Barth")
  })
})
