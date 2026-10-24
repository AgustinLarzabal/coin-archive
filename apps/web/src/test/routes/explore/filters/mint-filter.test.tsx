import { screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

const mint = {
  id: "40000000-0000-4000-8000-000000000001",
  slug: "rome-italy",
  name: "Rome Mint",
  place: "Rome",
  country: { code: "IT", name: "Italy" },
  startYear: 1900,
  endYear: null,
  operating: true,
}

it("shows the filtered empty state for a Mint with no Coins", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ mints: [mint] })))
  renderArchiveRoute("/?mint=rome-italy", [], [], undefined, [mint])

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})

it("shows a Mint catalogue request failure", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/", [], [], undefined, jsonResponse({}, 503))
  expect(await screen.findByText("Unable to load Mints")).toBeVisible()
})
