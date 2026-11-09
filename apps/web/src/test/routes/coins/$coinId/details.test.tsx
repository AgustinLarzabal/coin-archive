import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { createArchiveFetch } from "@/test/archive-route-test"
import { coinDetailFixture, coinListItemFixture } from "@/test/coin-fixtures"
import { jsonResponse, renderCoinRoute } from "@/test/coin-route-test"

describe("Coin viewer route details", () => {
  it.each(["Medal", "Coin", null] as const)(
    "shows %s Orientation only when known",
    async (orientation) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(jsonResponse(coinDetailFixture({ orientation })))
        )
      )
      renderCoinRoute()
      await screen.findByText("Issue Period")
      expect(Boolean(screen.queryByText("Coin Orientation"))).toBe(
        orientation !== null
      )
      if (orientation) expect(screen.getByText(orientation)).toBeInTheDocument()
    }
  )
  it.each([
    ["milled", "Machine struck"],
    [null, null],
  ] as const)(
    "shows a known Technique name and omits unknown",
    async (technique, techniqueName) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse(coinDetailFixture({ technique, techniqueName }))
          )
        )
      )
      renderCoinRoute()
      await screen.findByText("Issue Period")
      expect(Boolean(screen.queryByText("Coin Technique"))).toBe(
        techniqueName !== null
      )
      if (techniqueName)
        expect(screen.getByText(techniqueName)).toBeInTheDocument()
    }
  )
  it.each([
    ["circular", "Circular"],
    ["square", "Square"],
    ["oval", "Oval"],
    ["rectangular", "Rectangular"],
    [null, null],
  ] as const)(
    "shows a known Shape and omits an unknown Shape",
    async (shape, label) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse(coinDetailFixture({ shape, shapeName: label }))
          )
        )
      )
      renderCoinRoute()
      await screen.findByText("Issue Period")
      expect(Boolean(screen.queryByText("Coin Shape"))).toBe(label !== null)
      if (label) expect(screen.getByText(label)).toBeInTheDocument()
    }
  )
  it("omits the Tags row when the Coin has no Tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinDetailFixture())))
    )
    renderCoinRoute()
    await screen.findByText("Issue Period")
    expect(screen.queryByText("Tags")).not.toBeInTheDocument()
  })

  it("links each Tag to Explore with matching filtered Coins", async () => {
    const archiveFetch = createArchiveFetch({
      coins: [coinListItemFixture()],
      tags: [{ slug: "map", name: "Map" }],
    })
    const fetchMock = vi.fn((input: string | URL | Request) =>
      String(input).includes("/v1/coins/00000000-")
        ? Promise.resolve(
            jsonResponse(
              coinDetailFixture({ tags: [{ slug: "map", name: "Map" }] })
            )
          )
        : archiveFetch(input)
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderCoinRoute()

    fireEvent.click(await screen.findByRole("link", { name: "Map" }))
    await waitFor(() => expect(router.state.location.pathname).toBe("/"))
    expect(router.state.location.search).toMatchObject({ tag: "map" })
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/v1/coins?tag=map&page=1&pageSize=24"
      )
    )
  })

  it.each([
    [null, null, null],
    ["bimetallic", "Bimetallic", null],
    [null, null, "Copper and nickel"],
    ["bimetallic", "Bimetallic", "Copper and nickel"],
  ])(
    "shows independently known Composition and Detail",
    async (composition, compositionName, compositionDetail) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse(
              coinDetailFixture({
                composition,
                compositionName,
                compositionDetail,
              })
            )
          )
        )
      )
      renderCoinRoute()
      expect(await screen.findByText("Issue Period")).toBeInTheDocument()
      expect(Boolean(screen.queryByText("Coin Composition"))).toBe(
        compositionName !== null
      )
      expect(Boolean(screen.queryByText("Coin Composition Detail"))).toBe(
        compositionDetail !== null
      )
      if (compositionName)
        expect(screen.getByText(compositionName)).toBeInTheDocument()
      if (compositionDetail)
        expect(screen.getByText(compositionDetail)).toBeInTheDocument()
      expect(screen.queryByText("bimetallic")).not.toBeInTheDocument()
    }
  )
  it("shows known measurements with units and omits unknown measurements", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({ size: 25.75, thickness: null, weight: 8.125 })
          )
        )
      )
    )
    renderCoinRoute()
    expect(await screen.findByText("Coin Size")).toBeInTheDocument()
    expect(screen.getByText("25.75 mm")).toBeInTheDocument()
    expect(screen.getByText("Coin Weight")).toBeInTheDocument()
    expect(screen.getByText("8.125 g")).toBeInTheDocument()
    expect(screen.queryByText("Coin Thickness")).not.toBeInTheDocument()
  })

  it("shows multiple confirmed Mints with place, country, and operation period", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              mints: [
                {
                  id: "40000000-0000-4000-8000-000000000001",
                  slug: "rome-state-mint-italy",
                  name: "Zecca dello Stato",
                  place: "Rome",
                  country: { name: "Italy", code: "IT" },
                  startYear: null,
                  endYear: null,
                  operating: true,
                },
                {
                  id: "40000000-0000-4000-8000-000000000002",
                  slug: "ancient-mint",
                  name: "Ancient Mint",
                  place: "Athens",
                  country: { name: "Greece", code: "GR" },
                  startYear: -44,
                  endYear: -42,
                  operating: false,
                },
                {
                  id: "40000000-0000-4000-8000-000000000003",
                  slug: "closed-mint",
                  name: "Closed Mint",
                  place: "Milan",
                  country: { name: "Italy", code: "IT" },
                  startYear: null,
                  endYear: null,
                  operating: false,
                },
                {
                  id: "40000000-0000-4000-8000-000000000004",
                  slug: "unknown-mint",
                  name: "Unknown Mint",
                  place: "Naples",
                  country: { name: "Italy", code: "IT" },
                  startYear: null,
                  endYear: null,
                  operating: null,
                },
                {
                  id: "40000000-0000-4000-8000-000000000005",
                  slug: "partly-known-mint",
                  name: "Partly Known Mint",
                  place: "Turin",
                  country: { name: "Italy", code: "IT" },
                  startYear: 1900,
                  endYear: null,
                  operating: null,
                },
              ],
            })
          )
        )
      )
    )
    renderCoinRoute()
    expect(await screen.findByText("Mint")).toBeInTheDocument()
    expect(screen.getByText("Zecca dello Stato")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Zecca dello Stato" })).toBeNull()
    expect(screen.getByText("Rome, Italy")).toBeInTheDocument()
    expect(screen.getByText("Unknown–ongoing")).toBeInTheDocument()
    expect(screen.getByText("Ancient Mint")).toBeInTheDocument()
    expect(screen.getByText("Athens, Greece")).toBeInTheDocument()
    expect(screen.getByText("44–42 BCE")).toBeInTheDocument()
    expect(screen.getByText("Unknown (closed)")).toBeInTheDocument()
    expect(screen.getByText("Unknown")).toBeInTheDocument()
    expect(screen.getByText("1900–unknown")).toBeInTheDocument()
  })

  it("omits Mint details for a Coin with no confirmed Mint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinDetailFixture())))
    )
    renderCoinRoute()
    expect(await screen.findByText("Issue Period")).toBeInTheDocument()
    expect(screen.queryByText("Mint")).not.toBeInTheDocument()
  })
  it("renders separate Face Value and Currency rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              faceValue: {
                label: "2 euro",
                numericValue: 2,
                currency: {
                  slug: "euro",
                  name: "Euro",
                  fullName: "Euro (1999–present)",
                },
              },
            })
          )
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Face Value")).toBeInTheDocument()
    expect(screen.getByText("2 euro")).toBeInTheDocument()
    expect(screen.getByText("Currency")).toBeInTheDocument()
    expect(screen.getByText("Euro (1999–present)")).toBeInTheDocument()
  })

  it("omits Face Value and Currency rows when uncurated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinDetailFixture())))
    )

    renderCoinRoute()

    expect(await screen.findByText("Issue Period")).toBeInTheDocument()
    expect(screen.queryByText("Face Value")).not.toBeInTheDocument()
    expect(screen.queryByText("Currency")).not.toBeInTheDocument()
  })

  it.each([
    ["standard-circulation", "Standard circulation"],
    ["circulating-commemorative", "Circulating commemorative"],
    ["non-circulating", "Non-circulating"],
    ["pattern-issue", "Pattern issue"],
  ] as const)("renders %s as %s", async (distribution, label) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({ distribution, distributionName: label })
          )
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Coin Distribution")).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText(distribution)).not.toBeInTheDocument()
  })

  it("shows the current catalogue name for a Coin Distribution", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          coinDetailFixture({
            distribution: "non-circulating",
            distributionName: "Collector issue",
          })
        )
      )
    )
    vi.stubGlobal("fetch", fetchMock)
    renderCoinRoute()
    expect(await screen.findByText("Collector issue")).toBeInTheDocument()
    expect(screen.queryByText("Non-circulating")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("groups consecutive Ruling Authorities by Role in curated order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              rulers: [
                {
                  slug: "first-co-ruler",
                  name: "First Co-ruler",
                  role: "King",
                  tenure: "2000–2002",
                },
                {
                  slug: "second-co-ruler",
                  name: "Second Co-ruler",
                  role: "King",
                  tenure: null,
                },
                {
                  slug: "shared-period",
                  name: "Shared Period",
                  role: "Period",
                  tenure: "circa 2001",
                },
                {
                  slug: "later-king",
                  name: "Later King",
                  role: "King",
                  tenure: "2003–present",
                },
              ],
            })
          )
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Argentina")).toBeInTheDocument()
    expect(screen.getAllByText("King")).toHaveLength(2)
    expect(screen.getByText("Period")).toBeInTheDocument()
    const details = screen.getByText("Issue Period").closest("dl")
    expect(details).toHaveTextContent(
      "KingFirst Co-ruler (2000–2002)Second Co-rulerPeriodShared Period (circa 2001)KingLater King (2003–present)"
    )
    expect(screen.queryByText("Ruler / Period")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "First Co-ruler" })).toBeNull()
  })

  it("omits Ruling Authority rows for an uncurated Coin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinDetailFixture())))
    )

    renderCoinRoute()

    expect(await screen.findByText("Issue Period")).toBeInTheDocument()
    expect(screen.queryByText("Ruler / Period")).not.toBeInTheDocument()
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument()
  })

  it("renders a multi-year CE Issue Period in Coin details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(coinDetailFixture({ lastIssueYear: 2007 }))
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Issue Period")).toBeInTheDocument()
    expect(screen.getByText("2004–2007")).toBeInTheDocument()
  })

  it("renders a cross-era Issue Period in Coin details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({ firstIssueYear: -2, lastIssueYear: 2 })
          )
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Issue Period")).toBeInTheDocument()
    expect(screen.getByText("2 BCE–2 CE")).toBeInTheDocument()
    expect(screen.queryByText(/-2|year 0/i)).not.toBeInTheDocument()
  })

  it("renders a BCE Issue Period in Coin details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({ firstIssueYear: -44, lastIssueYear: -42 })
          )
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Issue Period")).toBeInTheDocument()
    expect(screen.getByText("44–42 BCE")).toBeInTheDocument()
    expect(screen.queryByText(/-44|-42/)).not.toBeInTheDocument()
  })

  it("renders an Archive-defined Issuer without a flag or visible Issuer Code", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          coinDetailFixture({
            title: "Roman coin",
            issuer: { name: "Roman Empire", code: "ROMAN" },
          })
        )
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute()

    expect(await screen.findByText("Roman Empire")).toBeInTheDocument()
    expect(screen.queryByText("ROMAN")).not.toBeInTheDocument()
    expect(screen.queryByAltText("")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
