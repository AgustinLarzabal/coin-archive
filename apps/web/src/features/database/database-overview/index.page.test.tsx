import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { DatabaseOverviewRouteComponent } from "./index"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./overview-table", () => ({
  DatabaseOverviewTable: () => "Database overview table",
}))

const counts = {
  coins: 14,
  catalogues: 3,
  compositions: 5,
  currencies: 2,
  distributions: 4,
  edges: 7,
  rims: 11,
  shapes: 11,
  mintingTechniques: 9,
  engravers: 6,
  themes: 12,
  issuers: 8,
  rulers: 5,
  rulerGroups: 4,
  orientations: 10,
  mints: 9,
} as const

describe("DatabaseOverviewRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <DatabaseOverviewRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the overview table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <DatabaseOverviewRouteComponent
        loaderData={{
          isAllowed: true,
          counts: { ...counts },
        }}
      />
    )

    expect(markup).toContain("Database overview table")
  })
})
