import { fireEvent, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("shows an empty message for unmatched Issuer search text", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      issuers: [{ name: "Argentina", code: "AR" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute()
  const combobox = await screen.findByRole("combobox", { name: "Issuer" })

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "missing issuer" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })

  expect(await screen.findByText("No issuers found.")).toBeInTheDocument()
  expect(router.state.location.searchStr).toBe("")
  expect(
    fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/v1/coins")
    )
  ).toHaveLength(1)
})
