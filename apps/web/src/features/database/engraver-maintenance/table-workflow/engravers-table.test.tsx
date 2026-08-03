import type { Engraver } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { EngraversTable } from "./engravers-table"

const engravers: Engraver[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"engraver-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"engraver-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("EngraversTable", () => {
  it("renders Engraver Name and Engraver Code columns with maintenance affordances", () => {
    const markup = renderToStaticMarkup(
      <EngraversTable engravers={engravers} />
    )

    expect(markup).toContain("Engraver Code")
    expect(markup).toContain("Engraver Name")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
