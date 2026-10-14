import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("navigates duplicate names by keyboard and selects an Engraver by pointer", async () => {
  const coin = {
    id: "00000000-0000-4000-8000-000000000001",
    title: "First coin",
    issuer: { name: "Argentina", code: "AR" },
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T11:00:00.000Z",
    obverseImageUrl: null,
    reverseImageUrl: null,
  }
  const fetchMock = vi.fn(
    createArchiveFetch({
      coins: [coin],
      engravers: [
        { slug: "first-engraver", fullName: "Shared Name" },
        { slug: "second-engraver", fullName: "Shared Name" },
      ],
      issuers: [{ name: "Argentina", code: "AR" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR")

  const issuerSelect = await screen.findByRole("combobox", { name: "Issuer" })
  const engraverCombobox = screen.getByRole("combobox", { name: "Engraver" })
  expect(
    issuerSelect.compareDocumentPosition(engraverCombobox) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()

  engraverCombobox.focus()
  fireEvent.input(engraverCombobox, { target: { value: "Shared" } })
  fireEvent.keyDown(engraverCombobox, { key: "ArrowDown" })
  const duplicateOptions = await screen.findAllByRole("option", {
    name: "Shared Name",
  })
  expect(duplicateOptions).toHaveLength(2)
  expect(engraverCombobox).toHaveAttribute("aria-activedescendant")
  fireEvent.click(duplicateOptions[1])

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "second-engraver",
    })
  )
  const selectedCombobox = screen.getByRole("combobox", { name: "Engraver" })
  expect(selectedCombobox).toHaveValue("Shared Name")
  expect(selectedCombobox).toHaveFocus()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&engraver=second-engraver&page=1&pageSize=24"
  )
})
