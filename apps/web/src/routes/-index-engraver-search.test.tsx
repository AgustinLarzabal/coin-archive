import { fireEvent, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("shows an empty message for unmatched Engraver search text", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      issuers: [{ name: "Argentina", code: "AR" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR")
  const combobox = await screen.findByRole("combobox", { name: "Engraver" })

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "missing name" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })

  expect(await screen.findByText("No engravers found.")).toBeInTheDocument()
  expect(router.state.location.searchStr).toBe("?issuer=AR")
  expect(
    fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/v1/coins")
    )
  ).toHaveLength(1)
})
