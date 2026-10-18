import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { coinDetailFixture } from "@/test/coin-fixtures"
import { jsonResponse, renderCoinRoute } from "@/test/coin-route-test"

describe("Coin viewer route details", () => {
  it("renders separate Face Value and Currency rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              faceValue: {
                label: "2 euro",
                value: 2,
                currencySlug: "euro",
                currencyName: "Euro",
                currencyFullName: "Euro (1999–present)",
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
  ] as const)("renders %s as %s", async (distribution, label) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse(coinDetailFixture({ distribution })))
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Coin Distribution")).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText(distribution)).not.toBeInTheDocument()
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
    expect(
      screen.getByRole("link", { name: "First Co-ruler" })
    ).toHaveAttribute("href", "/?ruler=first-co-ruler")
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
