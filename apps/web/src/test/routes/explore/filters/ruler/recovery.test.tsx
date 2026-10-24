import { screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("shows the missing Ruling Authority message", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?ruler=missing-authority", [
    { slug: "known-authority", name: "Known Authority" },
  ])

  expect(await screen.findByText("Ruler / Period not found")).toBeVisible()
})
