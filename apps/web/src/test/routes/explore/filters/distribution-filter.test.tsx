import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("selects a Distribution, preserves filters, and returns to the first page", async () => {
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = String(input)

    if (url.endsWith("/v1/issuers")) {
      return Promise.resolve(
        jsonResponse({ issuers: [{ code: "AR", name: "Argentina" }] })
      )
    }
    if (url.endsWith("/v1/engravers")) {
      return Promise.resolve(
        jsonResponse({
          engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        })
      )
    }
    if (url.endsWith("/v1/rulers")) {
      return Promise.resolve(
        jsonResponse({
          rulers: [{ slug: "selected-authority", name: "Selected Authority" }],
        })
      )
    }

    const page = Number(new URL(url).searchParams.get("page"))
    return Promise.resolve(
      coinListJsonResponse([], {
        page,
        pageSize: 24,
        totalItems: 49,
        totalPages: 3,
      })
    )
  })
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&engraver=first-engraver&ruler=selected-authority&year=-44&page=3"
  )
  const combobox = await screen.findByRole("combobox", {
    name: "Distribution",
  })

  expect(combobox).toHaveValue("")
  const distributionControl = combobox.parentElement
  if (!distributionControl) {
    throw new Error("Distribution combobox control not found")
  }
  fireEvent.click(
    within(distributionControl).getByRole("button", {
      name: "Toggle options",
    })
  )
  fireEvent.click(screen.getByRole("option", { name: "Non-circulating" }), {
    detail: 0,
  })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: "non-circulating",
      engraver: "first-engraver",
      issuer: "AR",
      ruler: "selected-authority",
      year: -44,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?distribution=non-circulating&engraver=first-engraver&issuer=AR&ruler=selected-authority&year=-44&page=1&pageSize=24"
  )
})

it("restores one Coin Distribution and exposes its clear control", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        issuers: [{ code: "AR", name: "Argentina" }],
      })
    )
  )
  renderArchiveRoute("/?distribution=non-circulating&issuer=AR&year=-44")
  const combobox = await screen.findByRole("combobox", {
    name: "Distribution",
  })

  expect(combobox).toHaveValue("Non-circulating")
  const distributionControl = combobox.parentElement
  if (!distributionControl) {
    throw new Error("Distribution combobox control not found")
  }

  expect(
    within(distributionControl).getByRole("button", {
      name: "Clear Distribution",
    })
  ).toBeVisible()
})

it("recovers from an invalid Coin Distribution in a hand-edited URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?issuer=AR&distribution=unknown")

  const combobox = await screen.findByRole("combobox", {
    name: "Distribution",
  })
  expect(combobox).toHaveValue("")
  expect(combobox).toHaveAttribute("placeholder", "All distributions")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: undefined,
      issuer: "AR",
    })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})

it("shows the current catalogue name for a selected Distribution", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute(
    "/?distribution=non-circulating",
    [],
    [],
    [
      { slug: "non-circulating", name: "Collector issue" },
      { slug: "unused-pattern", name: "Pattern" },
    ]
  )
  const combobox = await screen.findByRole("combobox", { name: "Distribution" })
  expect(combobox).toHaveValue("Collector issue")
})
