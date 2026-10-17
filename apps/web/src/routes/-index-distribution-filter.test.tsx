import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("selects, shares, restores, and clears one accessible Coin Distribution while preserving filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?distribution=standard-circulation&issuer=AR&engraver=first-engraver&ruler=augustus&year=-44&page=3"
  )
  const user = userEvent.setup()
  const select = await screen.findByRole("combobox", { name: "Distribution" })

  expect(select).toHaveValue("standard-circulation")
  await user.selectOptions(select, "non-circulating")

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: "non-circulating",
      issuer: "AR",
      engraver: "first-engraver",
      ruler: "augustus",
      year: -44,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?distribution=non-circulating&issuer=AR&engraver=first-engraver&ruler=augustus&year=-44&page=1&pageSize=24"
  )

  await user.selectOptions(select, "")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "first-engraver",
      ruler: "augustus",
      year: -44,
    })
  )
})

it("recovers from an invalid Coin Distribution in a hand-edited URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?issuer=AR&distribution=unknown")

  expect(
    await screen.findByRole("combobox", { name: "Distribution" })
  ).toHaveValue("")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: undefined,
      issuer: "AR",
    })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})
