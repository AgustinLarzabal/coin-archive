import type { EdgeOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { EdgeFilterCombobox } from "./edge-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const edges: EdgeOption[] = [
  {
    id: "edge-1",
    code: "reeded",
    name: "Reeded",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "edge-2",
    code: "lettered",
    name: "Lettered",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("EdgeFilterCombobox", () => {
  it("renders the homepage Edge combobox with the selected edge name and code label", () => {
    const markup = renderToStaticMarkup(
      <EdgeFilterCombobox
        edges={edges}
        onValueChange={() => Promise.resolve()}
        selectedEdge={edges[0]}
      />
    )

    expect(markup).toContain("Reeded")
    expect(markup).toContain("reeded")
  })
})
