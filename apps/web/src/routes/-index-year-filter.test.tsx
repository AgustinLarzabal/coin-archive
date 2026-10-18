import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("applies, restores, and independently clears an accessible BCE Issue Year filter", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&engraver=first-engraver&page=3"
  )
  const user = userEvent.setup()
  const yearInput = await screen.findByRole("textbox", { name: "Year" })

  await user.type(yearInput, "  44   bCe  ")
  await user.keyboard("{Enter}")

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "first-engraver",
      year: -44,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&engraver=first-engraver&year=-44&page=1&pageSize=24"
  )
  expect(
    router.options.context.queryClient.getQueryState([
      "coins",
      "list",
      {
        currencySlug: null,
        faceValueAmount: null,
        engraverSlug: "first-engraver",
        issuerCode: "AR",
        issueYear: -44,
        page: 1,
        pageSize: 24,
      },
    ])?.status
  ).toBe("success")

  router.history.back()
  await waitFor(() => expect(yearInput).toHaveValue(""))
  router.history.forward()
  await waitFor(() => expect(yearInput).toHaveValue("44 BCE"))

  await user.click(screen.getByRole("button", { name: "Clear Year" }))
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "first-engraver",
    })
  )
})

it("accepts, canonicalizes, restores, and clears a friendly CE range", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR")
  const user = userEvent.setup()
  const yearInput = await screen.findByRole("textbox", { name: "Year" })

  await user.type(yearInput, " 1986  –  1990 ")
  expect(router.state.location.search).toEqual({ issuer: "AR" })
  await user.click(screen.getByRole("button", { name: "Apply Year" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: "1986-1990",
    })
  )
  expect(yearInput).toHaveValue("1986–1990")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&year=1986-1990&page=1&pageSize=24"
  )

  router.history.back()
  await waitFor(() => expect(yearInput).toHaveValue(""))
  router.history.forward()
  await waitFor(() => expect(yearInput).toHaveValue("1986–1990"))

  await user.click(screen.getByRole("button", { name: "Clear Year" }))
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "AR" })
  )

  await user.type(yearInput, " 1986 - 1990 ")
  await user.keyboard("{Enter}")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: "1986-1990",
    })
  )
})

it("returns to the first page when reapplying the active Year", async () => {
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = String(input)

    if (url.endsWith("/v1/issuers")) {
      return Promise.resolve(
        jsonResponse({ issuers: [{ code: "AR", name: "Argentina" }] })
      )
    }
    if (url.endsWith("/v1/engravers")) {
      return Promise.resolve(jsonResponse({ engravers: [] }))
    }
    if (url.endsWith("/v1/rulers")) {
      return Promise.resolve(jsonResponse({ rulers: [] }))
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
  const router = renderArchiveRoute("/?issuer=AR&year=-25-19&page=3")
  const user = userEvent.setup()

  expect(await screen.findByRole("textbox", { name: "Year" })).toHaveValue(
    "25 BCE–19 CE"
  )
  await user.click(screen.getByRole("button", { name: "Apply Year" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: "-25-19",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&year=-25-19&page=1&pageSize=24"
  )
})

it.each([
  [" 400 – 300 bCe ", "-400--300", "400–300 BCE", "apply"],
  [" 25 BCE - 19 ce ", "-25-19", "25 BCE–19 CE", "enter"],
] as const)(
  "accepts %s and applies the canonical signed range",
  async (draft, canonicalYear, displayYear, submission) => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      "/?issuer=AR&engraver=first-engraver&page=3"
    )
    const user = userEvent.setup()
    const yearInput = await screen.findByRole("textbox", { name: "Year" })

    await user.type(yearInput, draft)
    if (submission === "enter") {
      await user.keyboard("{Enter}")
    } else {
      await user.click(screen.getByRole("button", { name: "Apply Year" }))
    }

    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        issuer: "AR",
        engraver: "first-engraver",
        year: canonicalYear,
      })
    )
    expect(yearInput).toHaveValue(displayYear)
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/v1/coins?issuer=AR&engraver=first-engraver&year=${canonicalYear}&page=1&pageSize=24`
    )
    router.history.back()
    await waitFor(() => expect(yearInput).toHaveValue(""))
    router.history.forward()
    await waitFor(() => expect(yearInput).toHaveValue(displayYear))

    const clearButton = screen.getByRole("button", { name: "Clear Year" })
    clearButton.focus()
    await user.keyboard("{Enter}")
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        issuer: "AR",
        engraver: "first-engraver",
      })
    )
  }
)

it("shows an inline error for an invalid range without changing results", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?year=1986-1990")
  const user = userEvent.setup()
  const yearInput = await screen.findByRole("textbox", { name: "Year" })

  await user.clear(yearInput)
  await user.type(yearInput, "1990-1986")
  yearInput.focus()
  await user.keyboard("{Enter}")

  const message =
    "Enter one Issue Year or an ordered range, such as 400–300 BCE, 25 BCE–19 CE, or 1986–1990."
  expect(screen.getByText(message)).toBeVisible()
  expect(yearInput).toHaveAccessibleDescription(message)
  expect(yearInput).toHaveFocus()
  expect(router.state.location.search).toEqual({ year: "1986-1990" })
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

it("canonicalizes an invalid directly opened Year URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?issuer=AR&year=-044")

  await screen.findByRole("textbox", { name: "Year" })
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "AR" })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})

it("shows the filtered empty state for a valid Issue Year", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

  renderArchiveRoute("/?year=1986")

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
})

it("restores and displays a canonical BCE Issue Year without exposing its sign", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

  renderArchiveRoute("/?year=-44")

  expect(await screen.findByRole("textbox", { name: "Year" })).toHaveValue(
    "44 BCE"
  )
  expect(screen.getByText("No coins match the selected filters.")).toBeVisible()
  expect(screen.queryByText(/-44/)).not.toBeInTheDocument()
})

it("shows the filtered empty state for combined Issuer, Engraver, and Issue Year results", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        issuers: [{ code: "AR", name: "Argentina" }],
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      })
    )
  )

  renderArchiveRoute("/?issuer=AR&engraver=first-engraver&year=-25-19")

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})

it.each([
  ["-400--300", "400–300 BCE"],
  ["-25-19", "25 BCE–19 CE"],
] as const)(
  "renders the applied signed range %s without storage signs",
  async (canonicalYear, displayYear) => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

    renderArchiveRoute(`/?year=${canonicalYear}`)

    expect(await screen.findByRole("textbox", { name: "Year" })).toHaveValue(
      displayYear
    )
    expect(
      screen.getByText("No coins match the selected filters.")
    ).toBeVisible()
    expect(screen.queryByText(canonicalYear)).not.toBeInTheDocument()
  }
)
