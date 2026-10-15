import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
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
  expect(yearInput).toHaveValue("1986-1990")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&year=1986-1990&page=1&pageSize=24"
  )

  router.history.back()
  await waitFor(() => expect(yearInput).toHaveValue(""))
  router.history.forward()
  await waitFor(() => expect(yearInput).toHaveValue("1986-1990"))

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

it("shows an inline error for an invalid range without changing results", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?year=1986-1990")
  const user = userEvent.setup()
  const yearInput = await screen.findByRole("textbox", { name: "Year" })

  await user.clear(yearInput)
  await user.type(yearInput, "1990-1986")
  await user.click(screen.getByRole("button", { name: "Apply Year" }))

  const message =
    "Enter one Issue Year or an ordered CE range, such as 1986-1990."
  expect(screen.getByText(message)).toBeVisible()
  expect(yearInput).toHaveAccessibleDescription(message)
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

it("shows an informative empty state for a valid Year", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

  renderArchiveRoute("/?year=1986")

  expect(
    await screen.findByText(
      "No coins found with an Issue Period overlapping 1986."
    )
  ).toBeVisible()
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
})

it("restores and displays a canonical BCE Issue Year without exposing its sign", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

  renderArchiveRoute("/?year=-44")

  expect(await screen.findByRole("textbox", { name: "Year" })).toHaveValue(
    "44 BCE"
  )
  expect(
    screen.getByText("No coins found with an Issue Period overlapping 44 BCE.")
  ).toBeVisible()
  expect(screen.queryByText(/-44/)).not.toBeInTheDocument()
})

it("describes a combined-filter range empty state as Issue Period overlap", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        issuers: [{ code: "AR", name: "Argentina" }],
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      })
    )
  )

  renderArchiveRoute("/?issuer=AR&engraver=first-engraver&year=1986-1990")

  expect(
    await screen.findByText(
      "No coins found for Argentina engraved by First Engraver with an Issue Period overlapping 1986–1990."
    )
  ).toBeVisible()
})
