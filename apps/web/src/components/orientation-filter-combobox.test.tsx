import type { OrientationOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { OrientationFilterCombobox } from "./orientation-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const orientations: OrientationOption[] = [
  {
    id: "orientation-1",
    code: "coin-alignment",
    name: "Coin alignment",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "orientation-2",
    code: "medal-alignment",
    name: "Medal alignment",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("OrientationFilterCombobox", () => {
  it("renders the homepage Orientation combobox with the selected orientation name and code label", () => {
    const markup = renderToStaticMarkup(
      <OrientationFilterCombobox
        onValueChange={() => Promise.resolve()}
        orientations={orientations}
        selectedOrientation={orientations[0]}
      />
    )

    expect(markup).toContain("Coin alignment")
    expect(markup).toContain("coin-alignment")
  })
})
