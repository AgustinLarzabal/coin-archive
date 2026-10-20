import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type {
  FilterField,
  FilterQuery,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

vi.mock("@coin-archive/ui/components/reui/filters/filters", () => ({
  Filters: ({
    fields,
    onQueryChange,
    query,
  }: {
    fields: FilterField<string>[]
    onQueryChange: (query: FilterQuery<string>) => void
    query: FilterQuery<string>
  }) => (
    <>
      <button
        type="button"
        onClick={() => {
          const hasIssuer = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "issuer"
          )
          onQueryChange({
            ...query,
            rules: hasIssuer
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "issuer"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-issuer",
                    type: "rule",
                    path: ["issuer"],
                    operator: "is",
                    value: "AR",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Issuer
      </button>
      <button
        type="button"
        onClick={() => {
          const hasEngraver = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "engraver"
          )
          onQueryChange({
            ...query,
            rules: hasEngraver
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "engraver"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-engraver",
                    type: "rule",
                    path: ["engraver"],
                    operator: "is",
                    value: "first-engraver",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Engraver
      </button>
      <output data-testid="advanced-engraver-options">
        {fields
          .find((field) => field.id === "engraver")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
    </>
  ),
}))

it("applies and clears an advanced Issuer rule through the Explore URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ issuers: [{ name: "Argentina", code: "AR" }] }))
  )
  const router = renderArchiveRoute("/")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Issuer",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
    })
  )
  expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue(
    "Argentina"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: undefined })
  )
})

it("applies and clears an advanced Engraver rule while preserving Issuer", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      issuers: [{ name: "Argentina", code: "AR" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Engraver",
  })
  expect(screen.getByTestId("advanced-engraver-options")).toHaveTextContent(
    "First Engraver"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "first-engraver",
    })
  )
  expect(screen.getByRole("combobox", { name: "Engraver" })).toHaveValue(
    "First Engraver"
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?engraver=first-engraver&issuer=AR&page=1&pageSize=24"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: undefined,
    })
  )
})

it("restores an Engraver rule from the URL when Issuer changes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        issuers: [{ name: "Argentina", code: "AR" }],
      })
    )
  )
  const router = renderArchiveRoute("/?engraver=first-engraver")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Issuer",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      engraver: "first-engraver",
      issuer: "AR",
    })
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      engraver: "first-engraver",
      issuer: undefined,
    })
  )
})
