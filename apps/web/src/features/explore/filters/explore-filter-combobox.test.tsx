import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import { ExploreFilterCombobox } from "./explore-filter-combobox"

it("shows ordered options, the selected label, and a disabled recovery option", async () => {
  const onValueChange = vi.fn()
  const { rerender } = render(
    <ExploreFilterCombobox
      emptyMessage="No issuers"
      label="Issuer"
      onValueChange={onValueChange}
      options={[
        { label: "Argentina", value: "AR" },
        { label: "Unknown issuer", value: "UNKNOWN", disabled: true },
      ]}
      placeholder="Select issuer"
      value="AR"
    />
  )
  const combobox = screen.getByRole("combobox", { name: "Issuer" })
  expect(combobox).toHaveValue("Argentina")

  combobox.focus()
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  const options = await screen.findAllByRole("option")
  expect(options.map((option) => option.textContent)).toEqual([
    "Argentina",
    "Unknown issuer",
  ])
  expect(options[1]).toHaveAttribute("aria-disabled", "true")

  rerender(
    <ExploreFilterCombobox
      emptyMessage="No issuers"
      label="Issuer"
      onValueChange={onValueChange}
      options={[
        { label: "Argentine Republic", value: "AR" },
        { label: "Unknown issuer", value: "UNKNOWN", disabled: true },
      ]}
      placeholder="Select issuer"
      value="AR"
    />
  )
  await waitFor(() => expect(combobox).toHaveValue("Argentine Republic"))
  expect(onValueChange).not.toHaveBeenCalled()
})
