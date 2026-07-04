import { renderToStaticMarkup } from "react-dom/server"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { describe, expect, it, vi } from "vitest"

import {
  loadIssuerMaintenancePageData,
  renderIssuerMaintenancePage,
} from "./index"

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

vi.mock("@/components/tables/issuers/issuer-maintenance-sheet", () => ({
  IssuerMaintenanceSheet: () => null,
}))

describe("loadIssuerMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getIssuerMaintenanceRecords = vi.fn()

    await expect(
      loadIssuerMaintenancePageData(null, { getIssuerMaintenanceRecords })
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(getIssuerMaintenanceRecords).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getIssuerMaintenanceRecords = vi.fn()

    await expect(
      loadIssuerMaintenancePageData(
        { role: "collector" },
        { getIssuerMaintenanceRecords }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(getIssuerMaintenanceRecords).not.toHaveBeenCalled()
  })

  it("returns Issuer maintenance data for Editors and Admins", async () => {
    const issuers = [
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
    ]
    const getIssuerMaintenanceRecords = vi.fn().mockResolvedValue(issuers)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadIssuerMaintenancePageData(
          { role },
          { getIssuerMaintenanceRecords }
        )
      ).resolves.toStrictEqual({
        status: "success",
        issuers,
      })
    }
  })
})

describe("renderIssuerMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderIssuerMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Issuers table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderIssuerMaintenancePage({
        isAllowed: true,
        issuers: [
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
        ],
      })
    )

    expect(markup).toContain("Issuer Name")
    expect(markup).toContain("Issuer Code")
    expect(markup).toContain("Issuer ISO Code")
    expect(markup).toContain("Parent Issuer")
    expect(markup).toContain("Argentine Republic")
    expect(markup).toContain("Provincia de La Rioja")
    expect(markup).toContain("No Parent Issuer")
  })
})
