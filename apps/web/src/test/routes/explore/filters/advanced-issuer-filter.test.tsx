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
      <output data-testid="advanced-issuer-options">
        {fields
          .find((field) => field.id === "issuer")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <button
        type="button"
        onClick={() => {
          const hasRuler = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "ruler"
          )
          onQueryChange({
            ...query,
            rules: hasRuler
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "ruler"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-ruler",
                    type: "rule",
                    path: ["ruler"],
                    operator: "is",
                    value: "shared-b",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Ruler / Period
      </button>
      <output data-testid="advanced-ruler-options">
        {fields
          .find((field) => field.id === "ruler")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
    </>
  ),
}))

it("applies and clears an advanced Ruler / Period rule with duplicate names", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({ issuers: [{ name: "Argentina", code: "AR" }] })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3", [
    { slug: "shared-a", name: "Shared Name" },
    { slug: "shared-b", name: "Shared Name" },
  ])
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Ruler / Period",
  })
  expect(screen.getByTestId("advanced-ruler-options")).toHaveTextContent(
    "Shared Name (shared-a), Shared Name (shared-b)"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      ruler: "shared-b",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&ruler=shared-b&page=1&pageSize=24"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      ruler: undefined,
    })
  )
})

it("applies and clears an advanced Issuer rule through the Explore URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ issuers: [{ name: "Argentina", code: "AR" }] }))
  )
  const router = renderArchiveRoute("/")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Issuer",
  })
  expect(screen.getByTestId("advanced-issuer-options")).toHaveTextContent(
    "Argentina"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
    })
  )
  expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: undefined })
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

it("clears advanced Issuer without losing other filters and resets pagination", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      issuers: [{ name: "Argentina", code: "AR" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&ruler=selected-authority&engraver=first-engraver&year=1986&page=3",
    [{ slug: "selected-authority", name: "Selected Authority" }]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Issuer",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: undefined,
      ruler: "selected-authority",
      engraver: "first-engraver",
      year: 1986,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?engraver=first-engraver&ruler=selected-authority&year=1986&page=1&pageSize=24"
  )
})
