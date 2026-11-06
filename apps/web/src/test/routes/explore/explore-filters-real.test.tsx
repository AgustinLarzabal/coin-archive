import { fireEvent, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("offers the Explore filters in the filter picker", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        currencies: [
          { slug: "argentine-peso", name: "Peso", fullName: "Argentine peso" },
        ],
        issuers: [{ code: "AR", name: "Argentina" }],
      })
    )
  )
  renderArchiveRoute()

  fireEvent.click(await screen.findByRole("button", { name: "Add filter" }))
  expect((await screen.findAllByText("Issuer")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Distribution")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Currency")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Mint")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Engraver")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Ruler / Period")).length).toBeGreaterThan(
    0
  )
  expect((await screen.findAllByText("Issue year")).length).toBeGreaterThan(0)
})

it("loads a restored issue year range from the URL", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?year=-25-19")

  await screen.findByRole("button", { name: "Add filter" })
  expect(router.state.location.search.year).toBe("-25-19")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?year=-25-19&page=1&pageSize=24"
  )
})
