import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type { KeyboardEvent, ReactNode } from "react"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

vi.mock("@workspace/ui/components/combobox", async () => {
  const { createContext, useContext } = await import("react")
  const ComboboxContext = createContext<{
    items: Array<string>
    onValueChange: (value: string | null) => void
  } | null>(null)

  return {
    Combobox: ({
      children,
      items,
      onValueChange,
    }: {
      children: ReactNode
      items: Array<string>
      onValueChange: (value: string | null) => void
    }) => (
      <ComboboxContext value={{ items, onValueChange }}>
        {children}
      </ComboboxContext>
    ),
    ComboboxContent: () => null,
    ComboboxEmpty: () => null,
    ComboboxInput: ({ "aria-label": ariaLabel }: { "aria-label": string }) => {
      const context = useContext(ComboboxContext)

      return (
        <input
          aria-label={ariaLabel}
          role="combobox"
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              context?.onValueChange(context.items[1] ?? null)
            }
          }}
        />
      )
    },
    ComboboxItem: () => null,
    ComboboxList: () => null,
  }
})

it("selects an Engraver with Enter and preserves the Issuer", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [
          { slug: "first-engraver", fullName: "First Engraver" },
          { slug: "second-engraver", fullName: "Second Engraver" },
        ],
        issuers: [{ name: "Argentina", code: "AR" }],
      })
    )
  )
  const router = renderArchiveRoute("/?issuer=AR")
  const combobox = await screen.findByRole("combobox", { name: "Engraver" })

  combobox.focus()
  fireEvent.keyDown(combobox, { key: "Enter" })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "second-engraver",
    })
  )
  expect(combobox).toHaveFocus()
})
