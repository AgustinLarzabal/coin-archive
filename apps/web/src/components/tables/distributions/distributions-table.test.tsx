import type { DistributionOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DistributionsTable } from "./distributions-table"

const distributions: DistributionOption[] = [
  {
    id: "84863d38-795b-443c-bd27-1dedb73c0fad",
    code: "circulating-commemorative",
    name: "Circulating commemorative",
  },
  {
    id: "5da4ee39-7a50-49ec-90dd-d8276e8d2806",
    code: "standard-circulation",
    name: "Standard circulation",
  },
]

describe("DistributionsTable", () => {
  it("renders compact Code and Name columns with a create action", () => {
    const markup = renderToStaticMarkup(
      <DistributionsTable distributions={distributions} />
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Name")
    expect(markup).toContain("Circulating commemorative")
    expect(markup).toContain("Standard circulation")
    expect(markup).toContain(">Create</button>")
  })
})
