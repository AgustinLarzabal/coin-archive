import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("preserves the selected Ruling Authority when the Year changes", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute(
    "/?ruler=selected-authority&year=1986&page=3",
    [{ slug: "selected-authority", name: "Selected Authority" }]
  )
  const year = await screen.findByRole("textbox", { name: "Year" })
  const user = userEvent.setup()

  await user.clear(year)
  await user.type(year, "2004")
  await user.click(screen.getByRole("button", { name: "Apply Year" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      ruler: "selected-authority",
      year: 2004,
    })
  )
})
