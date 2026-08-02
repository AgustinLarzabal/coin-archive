import type { Distribution } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DistributionsTable } from "./distributions-table"

const metadata = {
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-version"',
}

const distributions: Distribution[] = [
  {
    ...metadata,
    id: "84863d38-795b-443c-bd27-1dedb73c0fad",
    code: "circulating-commemorative",
    name: "Circulating commemorative",
  },
  {
    ...metadata,
    id: "5da4ee39-7a50-49ec-90dd-d8276e8d2806",
    code: "standard-circulation",
    name: "Standard circulation",
  },
]

describe("DistributionsTable", () => {
  it("renders compact Code and Name columns with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <DistributionsTable distributions={distributions} />
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Name")
    expect(markup).toContain("Circulating commemorative")
    expect(markup).toContain("Standard circulation")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
