import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("selects an Issuer and keeps focus on its combobox", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      issuers: [
        { name: "Argentina", code: "AR" },
        { name: "Roman Empire", code: "ROMAN" },
      ],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute()
  const combobox = await screen.findByRole("combobox", { name: "Issuer" })

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "Roman" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  const option = screen.getByRole("option", { name: "Roman Empire" })
  expect(option).toHaveAttribute("data-highlighted")
  fireEvent.click(option, { detail: 0 })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "ROMAN" })
  )
  expect(combobox).toHaveValue("Roman Empire")
  expect(combobox).toHaveFocus()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=ROMAN"
  )
})
