import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CoinsMaintenanceTable } from "./coins-maintenance-table"

describe("CoinsMaintenanceTable", () => {
  it("renders the maintenance-focused columns, create action, filters, and pagination links", () => {
    const markup = renderToStaticMarkup(
      <CoinsMaintenanceTable
        search={{
          title: "spanish",
          issuer: "spain",
          page: 2,
        }}
        list={{
          items: [
            {
              id: "coin-1",
              title: "Spanish Euro Test Coin",
              issuer: {
                code: "spain",
                name: "Spain",
              },
              minYear: 1999,
              maxYear: 2001,
              faceValue: {
                text: "1 Euro",
                currency: {
                  code: "euro",
                  name: "Euro",
                },
              },
              distribution: {
                code: "standard-circulation",
                name: "Standard circulation",
              },
              composition: {
                code: "silver-900",
                name: "Silver .900",
              },
              createdAt: new Date("2026-06-24T12:00:00.000Z"),
              updatedAt: new Date("2026-06-25T12:00:00.000Z"),
            },
          ],
          page: 2,
          pageSize: 50,
          totalItems: 3,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        }}
        filterOptions={{
          issuers: [
            {
              id: "issuer-1",
              code: "spain",
              isoCode: "ES",
              name: "Spain",
            },
          ],
          rulers: [
            {
              id: "ruler-1",
              code: "charles-iii",
              name: "Charles III",
              group: null,
            },
          ],
          distributions: [
            {
              id: "distribution-1",
              code: "standard-circulation",
              name: "Standard circulation",
            },
          ],
          currencies: [
            {
              id: "currency-1",
              code: "euro",
              name: "Euro",
              fullName: "Euro",
            },
          ],
          compositions: [
            {
              id: "composition-1",
              code: "silver-900",
              name: "Silver .900",
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Create Coin")
    expect(markup).toContain('href="/database/coins/new"')
    expect(markup).toContain("Coin Title")
    expect(markup).toContain("Issuer")
    expect(markup).toContain("Issue Year Range")
    expect(markup).toContain("Face Value")
    expect(markup).toContain("Distribution")
    expect(markup).toContain("Composition")
    expect(markup).toContain("Updated")
    expect(markup).toContain("Created")
    expect(markup).toContain("Spanish Euro Test Coin")
    expect(markup).toContain('href="/database/coins/coin-1/edit"')
    expect(markup).toContain("1999-2001")
    expect(markup).toContain("1 Euro (Euro)")
    expect(markup).toContain('value="spanish"')
    expect(markup).toContain('value="spain" selected=""')
    expect(markup).toContain(
      'href="/database/coins?title=spanish&amp;issuer=spain&amp;page=1"'
    )
    expect(markup).toContain(
      'href="/database/coins?title=spanish&amp;issuer=spain&amp;page=3"'
    )
  })
})
