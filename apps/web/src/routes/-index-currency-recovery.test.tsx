import { fireEvent, screen, waitFor, within } from "@testing-library/react"
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
  const combobox = screen.getByRole("combobox", { name: "Currency" })
  expect(combobox).toHaveValue("Unknown Currency (missing-currency)")
  const control = combobox.closest('[data-slot="input-group"]')
  fireEvent.click(
    within(control as HTMLElement).getByRole("button", { name: "Clear" })
  )

  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "AR" })
  )
})
