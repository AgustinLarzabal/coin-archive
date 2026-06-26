import type { ComponentPropsWithoutRef } from "react"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DatabaseGeneralSummaryTable } from "./database-general-summary-table"

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
    const markup = renderToStaticMarkup(
      <DatabaseGeneralSummaryTable
        counts={{
          catalogues: 0,
          compositions: 12,
          currencies: 7,
          distributions: 1,
        }}
      />
    )

    expect(markup).toContain("Record type")
    expect(markup).toContain("Count")
    expect(markup).toContain('href="/database/catalogues"')
    expect(markup).toContain(">Catalogues</a>")
    expect(markup).toContain(">0<")
    expect(markup).toContain('href="/database/compositions"')
    expect(markup).toContain(">Compositions</a>")
    expect(markup).toContain(">12<")
    expect(markup).toContain('href="/database/currencies"')
    expect(markup).toContain(">Currencies</a>")
    expect(markup).toContain(">7<")
    expect(markup).toContain('href="/database/distributions"')
    expect(markup).toContain(">Distributions</a>")
    expect(markup).toContain(">1<")
  })
})
