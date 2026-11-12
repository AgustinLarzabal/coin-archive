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
        tags: [{ slug: "map", name: "Map" }],
        shapes: [{ slug: "pentagonal", name: "Pentagonal" }],
      })
    )
  )
  renderArchiveRoute()

  fireEvent.click(await screen.findByRole("button", { name: "Add filter" }))
  expect((await screen.findAllByText("Issuer")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Distribution")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Technique")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Tag")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Composition")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Shape")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Currency")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Mint")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Engraver")).length).toBeGreaterThan(0)
  expect((await screen.findAllByText("Ruler / Period")).length).toBeGreaterThan(
    0
  )
  expect((await screen.findAllByText("Issue year")).length).toBeGreaterThan(0)
})

it("restores Technique with Issuer and sends both to the Coin API", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      techniques: [{ slug: "milled", name: "Milled" }],
      issuers: [{ code: "AR", name: "Argentina" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?technique=milled&issuer=AR")

  expect(await screen.findByText("Milled")).toBeVisible()
  expect(router.state.location.search).toMatchObject({
    technique: "milled",
    issuer: "AR",
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&technique=milled&page=1&pageSize=24"
  )
  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})

it("restores Shape with Issuer and shows a filtered empty result", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      issuers: [{ code: "AR", name: "Argentina" }],
      shapes: [{ slug: "oval", name: "Oval" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?shape=oval&issuer=AR")

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
  expect(screen.getByText("Oval")).toBeVisible()
  expect(router.state.location.search).toMatchObject({
    shape: "oval",
    issuer: "AR",
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&shape=oval&page=1&pageSize=24"
  )
})

it("restores Medal Orientation from the URL", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?orientation=medal")
  expect(await screen.findByText("Medal")).toBeVisible()
  expect(router.state.location.search.orientation).toBe("medal")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?orientation=medal&page=1&pageSize=24"
  )
})

it("restores an Orientation added to the catalogue", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      orientations: [{ slug: "diagonal", name: "Diagonal" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?orientation=diagonal")
  expect(await screen.findByText("Diagonal")).toBeVisible()
  expect(router.state.location.search.orientation).toBe("diagonal")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?orientation=diagonal&page=1&pageSize=24"
  )
})

it("drops malformed Orientation from Explore search", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?orientation=Bad%20Slug")
  await screen.findByRole("button", { name: "Add filter" })
  expect(router.state.location.search.orientation).toBeUndefined()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?page=1&pageSize=24"
  )
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

it("restores Map from the Tag catalogue and filters Explore", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({ tags: [{ slug: "map", name: "Map" }] })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?tag=map")

  expect(await screen.findByText("Map")).toBeVisible()
  expect(router.state.location.search.tag).toBe("map")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?tag=map&page=1&pageSize=24"
  )
})

it("restores multiple Tags from a shared URL and sends both to the Coin API", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      tags: [
        { slug: "map", name: "Map" },
        { slug: "flag", name: "Flag" },
      ],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?tag=map&tag=flag")
  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
  expect(router.state.location.search.tag).toEqual(["map", "flag"])
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?tag=map&tag=flag&page=1&pageSize=24"
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
