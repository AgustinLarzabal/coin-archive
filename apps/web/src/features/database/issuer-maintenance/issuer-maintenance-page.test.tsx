import { renderToStaticMarkup } from "react-dom/server"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { describe, expect, it, vi } from "vitest"
import { IssuerMaintenanceRouteComponent } from "./issuer-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()

  return {
    ...actual,
    useRouter: () => ({
      invalidate: vi.fn(),
    }),
  }
})

vi.mock("./table-workflow/issuers-table", () => ({
  IssuersTable: () => "Issuers table",
}))

const issuerMaintenanceRecords = [
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
] as const

describe("IssuerMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <IssuerMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Issuers table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <IssuerMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          issuers: [...issuerMaintenanceRecords],
        }}
      />
    )

    expect(markup).toContain("Issuers table")
  })
})
