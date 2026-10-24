import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("keeps an unknown Currency available to clear without losing other filters", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ issuers: [{ code: "AR", name: "Argentina" }] }))
  )
  const router = renderArchiveRoute("/?currency=missing-currency&issuer=AR")

  expect(await screen.findByText("Currency not found")).toBeVisible()
  expect(
    screen.getByRole("group", { name: /Currency.*missing-currency/ })
  ).toBeVisible()
  fireEvent.click(
    screen.getByRole("button", { name: "Currency filter options" })
  )
  fireEvent.click(await screen.findByRole("menuitem", { name: "Remove" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "AR" })
  )
})
