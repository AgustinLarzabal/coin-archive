import type { ComponentPropsWithoutRef } from "react"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DatabaseGeneralSummaryTable } from "./database-general-summary-table"

type SummaryRow = {
  href: string
  label: string
  count: number
}

const summaryRowPattern =
  /<a href="([^"]+)" class="underline underline-offset-4">([^<]+)<\/a><\/td><td class="py-3">(\d+)<\/td>/g

function extractSummaryRows(markup: string): SummaryRow[] {
  return Array.from(
    markup.matchAll(summaryRowPattern),
    ([, href, label, count]) => ({
      href,
      label,
      count: Number(count),
    })
  )
}

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()

  return {
    ...actual,
    Link: ({
      children,
      to = "",
      ...props
    }: ComponentPropsWithoutRef<"a"> & {
      to?: string
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }
})

describe("DatabaseGeneralSummaryTable", () => {
  it("renders a plain summary table with stable linked rows and zero counts", () => {
    const expectedRows = [
      { href: "/database/catalogues", label: "Catalogues", count: 0 },
      { href: "/database/compositions", label: "Compositions", count: 12 },
      { href: "/database/currencies", label: "Currencies", count: 7 },
      { href: "/database/distributions", label: "Distributions", count: 1 },
      { href: "/database/edges", label: "Edges", count: 5 },
      { href: "/database/engravers", label: "Engravers", count: 9 },
      { href: "/database/issuers", label: "Issuers", count: 3 },
      { href: "/database/orientations", label: "Orientations", count: 0 },
      { href: "/database/mints", label: "Mints", count: 14 },
    ] as const

    const markup = renderToStaticMarkup(
      <DatabaseGeneralSummaryTable
        counts={{
          catalogues: 0,
          compositions: 12,
          currencies: 7,
          distributions: 1,
          edges: 5,
          engravers: 9,
          issuers: 3,
          orientations: 0,
          mints: 14,
        }}
      />
    )

    expect(markup).toContain("Record type")
    expect(markup).toContain("Count")
    expect(markup).toContain("<tbody>")
    expect(extractSummaryRows(markup)).toStrictEqual(expectedRows)
  })
})
