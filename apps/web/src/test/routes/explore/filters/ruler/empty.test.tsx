import { screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("shows the stable filtered empty state for a Ruling Authority", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?ruler=selected-authority", [
    { slug: "selected-authority", name: "Selected Authority" },
  ])

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})
