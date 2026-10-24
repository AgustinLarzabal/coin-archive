import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type {
  FilterField,
  FilterQuery,
  FilterRule,
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
          const hasCurrency = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "currency"
          )
          onQueryChange({
            ...query,
            rules: hasCurrency
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "currency"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-currency",
                    type: "rule",
                    path: ["currency"],
                    operator: "is",
                    value: "euro",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Currency
      </button>
      <output data-testid="advanced-currency-options">
        {fields
          .find((field) => field.id === "currency")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <button
        type="button"
        onClick={() => {
          const hasDistribution = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "distribution"
          )
          onQueryChange({
            ...query,
            rules: hasDistribution
              ? query.rules.filter(
                  (rule) =>
                    rule.type !== "rule" || rule.path[0] !== "distribution"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-distribution",
                    type: "rule",
                    path: ["distribution"],
                    operator: "is",
                    value:
                      fields
                        .find((field) => field.id === "distribution")
                        ?.options?.find(
                          (option) => option.value === "unused-pattern"
                        )?.value ?? "non-circulating",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Distribution
      </button>
      <output data-testid="advanced-distribution-options">
        {fields
          .find((field) => field.id === "distribution")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <output data-testid="advanced-distribution-selection">
        {query.rules.find(
          (rule): rule is FilterRule<string> =>
            rule.type === "rule" && rule.path[0] === "distribution"
        )?.value ?? ""}
      </output>
      <button
        type="button"
        onClick={() => {
          const hasYear = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "year"
          )
          onQueryChange({
            ...query,
            rules: hasYear
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "year"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-year",
                    type: "rule",
                    path: ["year"],
                    operator: "is",
                    value: "25 BCE–19 CE",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Year
      </button>
      <output data-testid="advanced-year-selection">
        {query.rules.find(
          (rule): rule is FilterRule<string> =>
            rule.type === "rule" && rule.path[0] === "year"
        )?.value ?? ""}
      </output>
      <output data-testid="advanced-year-field">
        {fields.find((field) => field.id === "year")?.label ?? ""}
      </output>
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
      <output data-testid="advanced-engraver-selection">
        {query.rules.find(
          (rule): rule is FilterRule<string> =>
            rule.type === "rule" && rule.path[0] === "engraver"
        )?.value ?? ""}
      </output>
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
          const hasMint = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "mint"
          )
          onQueryChange({
            ...query,
            rules: hasMint
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "mint"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-mint",
                    type: "rule",
                    path: ["mint"],
                    operator: "is",
                    value: "rome-italy",
                  },
                ],
          })
        }}
      >
        Toggle Advanced Mint
      </button>
      <output data-testid="advanced-mint-options">
        {fields
          .find((field) => field.id === "mint")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <output data-testid="advanced-mint-selection">
        {query.rules.find(
          (rule): rule is FilterRule<string> =>
            rule.type === "rule" && rule.path[0] === "mint"
        )?.value ?? ""}
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

const mint = {
  id: "40000000-0000-4000-8000-000000000001",
  slug: "rome-italy",
  name: "Rome Mint",
  place: "Rome",
  country: { code: "IT", name: "Italy" },
  startYear: 1900,
  endYear: null,
  operating: true,
}

it("applies, restores, and clears Year in advanced filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Year",
  })
  expect(screen.getByTestId("advanced-year-field")).toHaveTextContent("Year")
  expect(screen.queryByRole("button", { name: "Apply Year" })).toBeNull()
  expect(screen.queryByRole("button", { name: "Clear Year" })).toBeNull()

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: "-25-19",
    })
  )
  expect(screen.getByTestId("advanced-year-selection")).toHaveTextContent(
    "25 BCE–19 CE"
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&year=-25-19&page=1&pageSize=24"
  )

  router.history.back()
  await waitFor(() =>
    expect(screen.getByTestId("advanced-year-selection")).toBeEmptyDOMElement()
  )
  router.history.forward()
  await waitFor(() =>
    expect(screen.getByTestId("advanced-year-selection")).toHaveTextContent(
      "25 BCE–19 CE"
    )
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: undefined,
    })
  )
})

it("restores a BCE Year in the advanced filter", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?year=-44")

  expect(
    await screen.findByTestId("advanced-year-selection")
  ).toHaveTextContent("44 BCE")
  expect(screen.getByText("No coins match the selected filters.")).toBeVisible()
})

it("removes an invalid Year from a directly opened URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?issuer=AR&year=-044")

  await screen.findByTestId("advanced-year-selection")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "AR" })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})

it("applies and clears Engraver in advanced filters", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
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
      engraver: "first-engraver",
      issuer: "AR",
    })
  )
  expect(screen.getByTestId("advanced-engraver-selection")).toHaveTextContent(
    "first-engraver"
  )
  expect(screen.queryByRole("combobox", { name: "Engraver" })).toBeNull()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?engraver=first-engraver&issuer=AR&page=1&pageSize=24"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      engraver: undefined,
      issuer: "AR",
    })
  )
})

it("restores an unknown Engraver from the URL for recovery", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?engraver=unknown-engraver")

  expect(await screen.findByText("Engraver not found")).toBeVisible()
  expect(screen.getByTestId("advanced-engraver-selection")).toHaveTextContent(
    "unknown-engraver"
  )
  expect(screen.getByTestId("advanced-engraver-options")).toHaveTextContent(
    "Unknown engraver (unknown-engraver)"
  )
})

it("applies and clears Distribution in advanced filters while preserving other filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Distribution",
  })
  expect(screen.getByTestId("advanced-distribution-options")).toHaveTextContent(
    "Non-circulating"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: "non-circulating",
      issuer: "AR",
    })
  )
  expect(screen.queryByRole("combobox", { name: "Distribution" })).toBeNull()
  expect(
    screen.getByTestId("advanced-distribution-selection")
  ).toHaveTextContent("non-circulating")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?distribution=non-circulating&issuer=AR&page=1&pageSize=24"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: undefined,
      issuer: "AR",
    })
  )
})

it("restores an unknown Distribution in advanced filters from the URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?distribution=unknown-pattern")

  expect(
    await screen.findByTestId("advanced-distribution-selection")
  ).toHaveTextContent("unknown-pattern")
  expect(screen.getByTestId("advanced-distribution-options")).toHaveTextContent(
    "Unknown Distribution (unknown-pattern)"
  )
})

it("uses the catalogue name and slug for an advanced Distribution", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/",
    [],
    [],
    [{ slug: "unused-pattern", name: "Pattern" }]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Distribution",
  })
  expect(screen.getByTestId("advanced-distribution-options")).toHaveTextContent(
    "Pattern"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: "unused-pattern",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?distribution=unused-pattern&page=1&pageSize=24"
  )
})

it("discards a malformed Distribution slug from a hand-edited URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?issuer=AR&distribution=bad_slug")

  expect(
    await screen.findByTestId("advanced-distribution-selection")
  ).toHaveTextContent("")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: undefined,
      issuer: "AR",
    })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})

it("applies and clears Mint in advanced filters while preserving other filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch({ mints: [mint] }))
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=IT&year=2004&page=3",
    [],
    [],
    undefined,
    [mint]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Mint",
  })
  expect(screen.getByTestId("advanced-mint-options")).toHaveTextContent(
    "Rome Mint"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "IT",
      mint: "rome-italy",
      year: 2004,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=IT&mint=rome-italy&year=2004&page=1&pageSize=24"
  )
  expect(screen.queryByRole("combobox", { name: "Mint" })).toBeNull()

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "IT",
      mint: undefined,
      year: 2004,
    })
  )
})

it("restores a Mint from the URL and distinguishes Mints with the same name", async () => {
  const secondMint = {
    ...mint,
    id: "40000000-0000-4000-8000-000000000002",
    slug: "rome-mint-vatican",
    place: "Vatican City",
    country: { code: "VA", name: "Vatican City" },
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ mints: [mint, secondMint] }))
  )
  renderArchiveRoute("/?mint=rome-mint-vatican", [], [], undefined, [
    mint,
    secondMint,
  ])

  expect(
    await screen.findByTestId("advanced-mint-selection")
  ).toHaveTextContent("rome-mint-vatican")
  expect(screen.getByTestId("advanced-mint-options")).toHaveTextContent(
    "Rome Mint (Rome, Italy; rome-italy), Rome Mint (Vatican City, Vatican City; rome-mint-vatican)"
  )
})

it("shows an unknown Mint and keeps its URL slug for recovery", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ mints: [mint] })))
  renderArchiveRoute("/?mint=missing-mint", [], [], undefined, [mint])

  expect(await screen.findByText("Mint not found")).toBeVisible()
  expect(screen.getByTestId("advanced-mint-selection")).toHaveTextContent(
    "missing-mint"
  )
  expect(screen.getByTestId("advanced-mint-options")).toHaveTextContent(
    "Unknown Mint (missing-mint)"
  )
})

it("applies and clears Currency from the advanced filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&page=3",
    [],
    [{ slug: "euro", name: "Euro", fullName: "Euro (1999–present)" }]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Currency",
  })
  expect(screen.getByTestId("advanced-currency-options")).toHaveTextContent(
    "Euro (1999–present)"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      currency: "euro",
      issuer: "AR",
    })
  )
  expect(screen.queryByRole("combobox", { name: "Currency" })).toBeNull()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?currency=euro&issuer=AR&page=1&pageSize=24"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      currency: undefined,
      issuer: "AR",
    })
  )
})

it("restores Currency from the URL and clears its dependent Amount", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute(
    "/?currency=euro&amount=1",
    [],
    [{ slug: "euro", name: "Euro", fullName: "Euro (1999–present)" }]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Currency",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      amount: undefined,
      currency: undefined,
    })
  )
  expect(screen.getByRole("textbox", { name: "Amount" })).toBeDisabled()
})

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
