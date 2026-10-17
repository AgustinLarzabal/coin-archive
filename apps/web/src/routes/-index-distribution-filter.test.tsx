import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("selects one accessible Coin Distribution while preserving filters", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      issuers: [{ code: "AR", name: "Argentina" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&year=-44")
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

  expect(router.state.location.search).toEqual({
    distribution: "non-circulating",
    issuer: "AR",
    year: -44,
  })
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
    within(distributionControl).getByRole("button", { name: "Clear" })
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
