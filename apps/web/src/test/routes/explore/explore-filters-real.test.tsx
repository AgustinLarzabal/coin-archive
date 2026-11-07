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
  expect((await screen.findAllByText("Composition")).length).toBeGreaterThan(0)
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

it("restores Composition with another filter and sends both to the Coin API", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      compositions: [{ slug: "bimetallic", name: "Bimetallic" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?composition=bimetallic&issuer=AR")

  await screen.findByRole("button", { name: "Add filter" })
  expect(screen.getByText("Bimetallic")).toBeVisible()
  expect(router.state.location.search).toMatchObject({
    composition: "bimetallic",
    issuer: "AR",
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?composition=bimetallic&issuer=AR&page=1&pageSize=24"
  )
})
