import type { ShapeOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ShapeFilterCombobox } from "./shape-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const shapes: ShapeOption[] = [
  {
    id: "shape-1",
    code: "round",
    name: "Round",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "shape-2",
    code: "scalloped",
    name: "Scalloped",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("ShapeFilterCombobox", () => {
  it("renders the homepage Shape combobox with the selected shape name and code label", () => {
    const markup = renderToStaticMarkup(
      <ShapeFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedShape={shapes[0]}
        shapes={shapes}
      />
    )

    expect(markup).toContain("Round")
    expect(markup).toContain("round")
  })
})
