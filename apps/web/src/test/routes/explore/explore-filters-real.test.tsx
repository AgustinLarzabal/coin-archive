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
})
