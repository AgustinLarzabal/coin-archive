import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type {
  FilterField,
  FilterQuery,
  FilterRule,
} from "@coin-archive/ui/components/reui/filters/filters-types"

import {
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinDetailFixture, coinListItemFixture } from "@/test/coin-fixtures"

type FilterValue = string | [string | undefined, string | undefined]

vi.mock("@coin-archive/ui/components/reui/filters/filters", () => ({
  Filters: ({
    fields,
    onQueryChange,
    query,
  }: {
    fields: FilterField<FilterValue>[]
    onQueryChange: (query: FilterQuery<FilterValue>) => void
    query: FilterQuery<FilterValue>
  }) => (
    <>
      <output data-testid="filter-order">
        {query.rules
          .map((rule) => (rule.type === "rule" ? rule.path[0] : "group"))
          .join(",")}
      </output>
      <output data-testid="measurement-choices">
        {fields
          .filter((field) =>
            /^(size|thickness|weight)(Min|Max)?$/.test(field.id)
          )
          .map((field) => field.label)
          .join(", ")}
      </output>
      <output data-testid="measurement-operators">
        {fields
          .filter((field) =>
            /^(size|thickness|weight)(Min|Max)?$/.test(field.id)
          )
          .map(
            (field) =>
              `${field.type}:${typeof field.editor === "function" ? "custom" : field.editor}:${
                Array.isArray(field.operators)
                  ? field.operators
                      .filter((operator) => !operator.hidden)
                      .map(
                        (operator) =>
                          `${operator.value}${operator.arity === "range" ? ":range" : ""}`
                      )
                      .join("/")
                  : ""
              }`
          )
          .join(", ")}
      </output>
      <output data-testid="size-value">
        {query.rules
          .find(
            (rule): rule is FilterRule<FilterValue> =>
              rule.type === "rule" && rule.path[0] === "size"
          )
          ?.value?.toString() ?? ""}
      </output>
      <output data-testid="size-operator">
        {query.rules.find(
          (rule): rule is FilterRule<FilterValue> =>
            rule.type === "rule" && rule.path[0] === "size"
        )?.operator ?? ""}
      </output>
      <output data-testid="size-rule-count">
        {
          query.rules.filter(
            (rule) => rule.type === "rule" && rule.path[0] === "size"
          ).length
        }
      </output>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((rule) =>
              rule.type === "rule" &&
              rule.path[0] === "size" &&
              rule.operator === "between"
                ? { ...rule, value: ["30", "25"] as [string, string] }
                : rule
            ),
          })
        }
      >
        Reverse Size range
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules,
              {
                id: "test-size-eq",
                type: "rule",
                path: ["size"],
                operator: "eq",
                value: "25.75",
              },
            ],
          })
        }
      >
        Add Size equals
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules,
              {
                id: "test-size-between",
                type: "rule",
                path: ["size"],
                operator: "between",
                value: ["20", "30"] as [string, string],
              },
            ],
          })
        }
      >
        Add Size between
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((rule) =>
              rule.type === "rule" &&
              rule.path[0] === "size" &&
              rule.operator === "eq"
                ? {
                    ...rule,
                    operator: "between",
                    value: [rule.value as string, undefined],
                  }
                : rule
            ),
          })
        }
      >
        Switch Size to between
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((rule) =>
              rule.type === "rule" &&
              rule.path[0] === "size" &&
              rule.operator === "between"
                ? { ...rule, value: ["25.75", "30"] }
                : rule
            ),
          })
        }
      >
        Complete Size between
      </button>
      {(
        [
          { id: "thickness", equal: "2.25", from: "1.5", to: "2.75" },
          { id: "weight", equal: "8.125", from: "7.5", to: "9.25" },
        ] as const
      ).map(({ id, equal, from, to }) => (
        <div key={id}>
          <output data-testid={`${id}-operator`}>
            {query.rules.find(
              (rule): rule is FilterRule<FilterValue> =>
                rule.type === "rule" && rule.path[0] === id
            )?.operator ?? ""}
          </output>
          <button
            type="button"
            onClick={() =>
              onQueryChange({
                ...query,
                rules: [
                  ...query.rules,
                  {
                    id: `test-${id}-eq`,
                    type: "rule",
                    path: [id],
                    operator: "eq",
                    value: equal,
                  },
                ],
              })
            }
          >
            Add {id} equals
          </button>
          <button
            type="button"
            onClick={() =>
              onQueryChange({
                ...query,
                rules: [
                  ...query.rules,
                  {
                    id: `test-${id}-between`,
                    type: "rule",
                    path: [id],
                    operator: "between",
                    value: [from, to] as [string, string],
                  },
                ],
              })
            }
          >
            Add {id} between
          </button>
          <button
            type="button"
            onClick={() =>
              onQueryChange({
                ...query,
                rules: query.rules.map((rule) =>
                  rule.type === "rule" &&
                  rule.path[0] === id &&
                  rule.operator === "eq"
                    ? {
                        ...rule,
                        operator: "between",
                        value: [rule.value as string, undefined],
                      }
                    : rule
                ),
              })
            }
          >
            Switch {id} to between
          </button>
          <button
            type="button"
            onClick={() =>
              onQueryChange({
                ...query,
                rules: query.rules.map((rule) =>
                  rule.type === "rule" &&
                  rule.path[0] === id &&
                  rule.operator === "between"
                    ? { ...rule, value: [equal, to] as [string, string] }
                    : rule
                ),
              })
            }
          >
            Complete {id} between
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={
          !query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "amount"
          ) && fields.find((field) => field.id === "amount")?.disabled
        }
        onClick={() => {
          const hasAmount = query.rules.some(
            (rule) => rule.type === "rule" && rule.path[0] === "amount"
          )
          onQueryChange({
            ...query,
            rules: hasAmount
              ? query.rules.filter(
                  (rule) => rule.type !== "rule" || rule.path[0] !== "amount"
                )
              : [
                  ...query.rules,
                  {
                    id: "test-amount",
                    type: "rule",
                    path: ["amount"],
                    operator: "is",
                    value: "0.5",
                  },
                ],
          })
        }}
      >
        Toggle Amount
      </button>
      <output data-testid="amount-selection">
        {query.rules.find(
          (rule): rule is FilterRule<string> =>
            rule.type === "rule" && rule.path[0] === "amount"
        )?.value ?? ""}
      </output>
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
        Toggle Currency
      </button>
      <output data-testid="currency-options">
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
        Toggle Distribution
      </button>
      <output data-testid="distribution-options">
        {fields
          .find((field) => field.id === "distribution")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <output data-testid="distribution-selection">
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
        Toggle Year
      </button>
      <output data-testid="year-selection">
        {query.rules.find(
          (rule): rule is FilterRule<string> =>
            rule.type === "rule" && rule.path[0] === "year"
        )?.value ?? ""}
      </output>
      <output data-testid="year-field">
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
        Toggle Engraver
      </button>
      <output data-testid="engraver-options">
        {fields
          .find((field) => field.id === "engraver")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <output data-testid="engraver-selection">
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
        Toggle Issuer
      </button>
      <output data-testid="issuer-options">
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
        Toggle Mint
      </button>
      <output data-testid="mint-options">
        {fields
          .find((field) => field.id === "mint")
          ?.options?.map((option) => option.label)
          .join(", ")}
      </output>
      <output data-testid="mint-selection">
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
        Toggle Ruler / Period
      </button>
      <output data-testid="ruler-options">
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

it("enables Amount with Currency and applies and clears it in filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const amountToggle = await screen.findByRole("button", {
    name: "Toggle Amount",
  })
  expect(amountToggle).toBeDisabled()
  expect(screen.queryByRole("button", { name: "Apply Amount" })).toBeNull()

  fireEvent.click(screen.getByRole("button", { name: "Toggle Currency" }))
  await waitFor(() => expect(amountToggle).toBeEnabled())
  fireEvent.click(amountToggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      amount: "0.5",
      currency: "euro",
      issuer: "AR",
    })
  )
  expect(screen.getByTestId("amount-selection")).toHaveTextContent("0.5")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?amount=0.5&currency=euro&issuer=AR&page=1&pageSize=24"
  )

  fireEvent.click(amountToggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      amount: undefined,
      currency: "euro",
      issuer: "AR",
    })
  )
})

it("applies, restores, and clears Year in filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Year",
  })
  expect(screen.getByTestId("year-field")).toHaveTextContent("Year")
  expect(screen.queryByRole("button", { name: "Apply Year" })).toBeNull()
  expect(screen.queryByRole("button", { name: "Clear Year" })).toBeNull()

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: "-25-19",
    })
  )
  expect(screen.getByTestId("year-selection")).toHaveTextContent("25 BCE–19 CE")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&year=-25-19&page=1&pageSize=24"
  )

  router.history.back()
  await waitFor(() =>
    expect(screen.getByTestId("year-selection")).toBeEmptyDOMElement()
  )
  router.history.forward()
  await waitFor(() =>
    expect(screen.getByTestId("year-selection")).toHaveTextContent(
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

it("restores a BCE Year in the filter", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?year=-44")

  expect(await screen.findByTestId("year-selection")).toHaveTextContent(
    "44 BCE"
  )
  expect(screen.getByText("No coins match the selected filters.")).toBeVisible()
})

it("removes an invalid Year from a directly opened URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?issuer=AR&year=-044")

  await screen.findByTestId("year-selection")
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: "AR" })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})

it("applies and clears Engraver in filters", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Engraver",
  })
  expect(screen.getByTestId("engraver-options")).toHaveTextContent(
    "First Engraver"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      engraver: "first-engraver",
      issuer: "AR",
    })
  )
  expect(screen.getByTestId("engraver-selection")).toHaveTextContent(
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
  expect(screen.getByTestId("engraver-selection")).toHaveTextContent(
    "unknown-engraver"
  )
  expect(screen.getByTestId("engraver-options")).toHaveTextContent(
    "Unknown engraver (unknown-engraver)"
  )
})

it("applies and clears Distribution in filters while preserving other filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Distribution",
  })
  expect(screen.getByTestId("distribution-options")).toHaveTextContent(
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
  expect(screen.getByTestId("distribution-selection")).toHaveTextContent(
    "non-circulating"
  )
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

it("keeps filters in selection order after the URL updates", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/")

  fireEvent.click(await screen.findByRole("button", { name: "Toggle Issuer" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ issuer: "AR" })
  )
  fireEvent.click(screen.getByRole("button", { name: "Toggle Distribution" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({
      distribution: "non-circulating",
      issuer: "AR",
    })
  )
  expect(screen.getByTestId("filter-order")).toHaveTextContent(
    "issuer,distribution"
  )
  expect(router.state.location.searchStr).not.toContain("filterOrder")
  expect(router.state.location.state.exploreFilterOrder).toEqual([
    "issuer",
    "distribution",
  ])

  router.history.back()
  await waitFor(() =>
    expect(screen.getByTestId("filter-order")).toHaveTextContent("issuer")
  )
  router.history.forward()
  await waitFor(() =>
    expect(screen.getByTestId("filter-order")).toHaveTextContent(
      "issuer,distribution"
    )
  )
})

it("keeps chip order after opening a coin and returning to Explore", async () => {
  const coin = coinListItemFixture()
  const fetchArchive = createArchiveFetch({
    coins: [coin],
    issuers: [coin.issuer],
  })
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) =>
      String(input).includes(`/v1/coins/${coin.id}`)
        ? Promise.resolve(jsonResponse(coinDetailFixture()))
        : fetchArchive(input)
    )
  )
  const router = renderArchiveRoute("/")

  fireEvent.click(await screen.findByRole("button", { name: "Toggle Issuer" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ issuer: "AR" })
  )
  fireEvent.click(screen.getByRole("button", { name: "Toggle Distribution" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({
      distribution: "non-circulating",
      issuer: "AR",
    })
  )

  fireEvent.click(await screen.findByRole("link", { name: coin.title }))
  await waitFor(() =>
    expect(router.state.location.pathname).toBe(`/coins/${coin.id}`)
  )
  fireEvent.click(await screen.findByRole("link", { name: "Archive" }))
  await waitFor(() => expect(router.state.location.pathname).toBe("/"))
  expect(screen.getByTestId("filter-order")).toHaveTextContent(
    "issuer,distribution"
  )
  expect(router.state.location.searchStr).not.toContain("filterOrder")
})

it("restores an unknown Distribution in filters from the URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?distribution=unknown-pattern")

  expect(await screen.findByTestId("distribution-selection")).toHaveTextContent(
    "unknown-pattern"
  )
  expect(screen.getByTestId("distribution-options")).toHaveTextContent(
    "Unknown Distribution (unknown-pattern)"
  )
})

it("uses the catalogue name and slug for an Distribution", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/",
    [],
    [],
    [{ slug: "unused-pattern", name: "Pattern" }]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Distribution",
  })
  expect(screen.getByTestId("distribution-options")).toHaveTextContent(
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

  expect(await screen.findByTestId("distribution-selection")).toHaveTextContent(
    ""
  )
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: undefined,
      issuer: "AR",
    })
  )
  expect(router.state.location.searchStr).toBe("?issuer=AR")
})

it("applies and clears Mint in filters while preserving other filters", async () => {
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
    name: "Toggle Mint",
  })
  expect(screen.getByTestId("mint-options")).toHaveTextContent("Rome Mint")

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

  expect(await screen.findByTestId("mint-selection")).toHaveTextContent(
    "rome-mint-vatican"
  )
  expect(screen.getByTestId("mint-options")).toHaveTextContent(
    "Rome Mint (Rome, Italy; rome-italy), Rome Mint (Vatican City, Vatican City; rome-mint-vatican)"
  )
})

it("shows an unknown Mint and keeps its URL slug for recovery", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ mints: [mint] })))
  renderArchiveRoute("/?mint=missing-mint", [], [], undefined, [mint])

  expect(await screen.findByText("Mint not found")).toBeVisible()
  expect(screen.getByTestId("mint-selection")).toHaveTextContent("missing-mint")
  expect(screen.getByTestId("mint-options")).toHaveTextContent(
    "Unknown Mint (missing-mint)"
  )
})

it("applies and clears Currency from the filters", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&page=3",
    [],
    [{ slug: "euro", name: "Euro", fullName: "Euro (1999–present)" }]
  )
  const toggle = await screen.findByRole("button", {
    name: "Toggle Currency",
  })
  expect(screen.getByTestId("currency-options")).toHaveTextContent(
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
    name: "Toggle Currency",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      amount: undefined,
      currency: undefined,
    })
  )
  expect(screen.getByRole("button", { name: "Toggle Amount" })).toBeDisabled()
})

it("applies and clears an Ruler / Period rule with duplicate names", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({ issuers: [{ name: "Argentina", code: "AR" }] })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&page=3", [
    { slug: "shared-a", name: "Shared Name" },
    { slug: "shared-b", name: "Shared Name" },
  ])
  const toggle = await screen.findByRole("button", {
    name: "Toggle Ruler / Period",
  })
  expect(screen.getByTestId("ruler-options")).toHaveTextContent(
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

it("applies and clears an Issuer rule through the Explore URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ issuers: [{ name: "Argentina", code: "AR" }] }))
  )
  const router = renderArchiveRoute("/")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Issuer",
  })
  expect(screen.getByTestId("issuer-options")).toHaveTextContent("Argentina")

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
    name: "Toggle Issuer",
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

it("clears Issuer without losing other filters and resets pagination", async () => {
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
    name: "Toggle Issuer",
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

it("offers measurement bounds with units and resets the page when selected", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      pagination: { page: 2, pageSize: 24, totalItems: 72, totalPages: 3 },
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?page=2&weightMax=8.5")

  const add = await screen.findByRole("button", { name: "Add Size equals" })
  expect(screen.getByTestId("measurement-choices")).toHaveTextContent(
    "Size (mm), Thickness (mm), Weight (g)"
  )
  expect(screen.getByTestId("measurement-operators")).toHaveTextContent(
    "number:custom:eq/between:range, number:custom:eq/between:range, number:custom:eq/between:range"
  )
  fireEvent.click(add)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      sizeMin: "25.75",
      sizeMax: "25.75",
      weightMax: "8.5",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?sizeMin=25.75&sizeMax=25.75&weightMax=8.5&page=1&pageSize=24"
  )
  fireEvent.click(screen.getByRole("button", { name: "Add Size between" }))
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      sizeMin: "20",
      sizeMax: "30",
      weightMax: "8.5",
    })
  )
})

it("applies equal and between bounds for Thickness and Weight", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/")

  fireEvent.click(
    await screen.findByRole("button", { name: "Add thickness equals" })
  )
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      thicknessMin: "2.25",
      thicknessMax: "2.25",
    })
  )
  fireEvent.click(screen.getByRole("button", { name: "Add weight equals" }))
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      thicknessMin: "2.25",
      thicknessMax: "2.25",
      weightMin: "8.125",
      weightMax: "8.125",
    })
  )
  fireEvent.click(screen.getByRole("button", { name: "Add thickness between" }))
  fireEvent.click(screen.getByRole("button", { name: "Add weight between" }))
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      thicknessMin: "1.5",
      thicknessMax: "2.75",
      weightMin: "7.5",
      weightMax: "9.25",
    })
  )
  expect(screen.getByTestId("thickness-operator")).toHaveTextContent("between")
  expect(screen.getByTestId("weight-operator")).toHaveTextContent("between")
})

it("switches equal Weight to a range before its second bound is entered", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?weightMin=8.125&weightMax=8.125")

  fireEvent.click(
    await screen.findByRole("button", { name: "Switch weight to between" })
  )
  expect(screen.getByTestId("weight-operator")).toHaveTextContent("between")
  expect(router.state.location.search).toEqual({
    weightMin: "8.125",
    weightMax: "8.125",
  })

  fireEvent.click(
    screen.getByRole("button", { name: "Complete weight between" })
  )
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      weightMin: "8.125",
      weightMax: "9.25",
    })
  )
})

it("keeps the displayed measurement aligned with results when a new bound reverses the range", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?sizeMin=20&sizeMax=25")

  const reverse = await screen.findByRole("button", {
    name: "Reverse Size range",
  })
  fireEvent.click(reverse)
  expect(screen.getByTestId("size-value")).toHaveTextContent("20,25")
  expect(router.state.location.search).toEqual({ sizeMin: "20", sizeMax: "25" })
  expect(fetchMock).not.toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?sizeMin=30&sizeMax=25&page=1&pageSize=24"
  )
})

it("replaces a legacy one-sided Size bound without leaving a duplicate chip", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?sizeMin=20")

  fireEvent.click(
    await screen.findByRole("button", { name: "Add Size equals" })
  )
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      sizeMin: "25.75",
      sizeMax: "25.75",
    })
  )
  expect(screen.getByTestId("size-rule-count")).toHaveTextContent("1")
})

it("switches an equal Size to a range before its second bound is entered", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/?sizeMin=25.75&sizeMax=25.75")

  fireEvent.click(
    await screen.findByRole("button", { name: "Switch Size to between" })
  )
  expect(screen.getByTestId("size-operator")).toHaveTextContent("between")
  expect(router.state.location.search).toEqual({
    sizeMin: "25.75",
    sizeMax: "25.75",
  })

  fireEvent.click(screen.getByRole("button", { name: "Complete Size between" }))
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      sizeMin: "25.75",
      sizeMax: "30",
    })
  )
})

it("restores exact Size ranges and one-sided links", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute(
    "/?sizeMin=100000000000000001&sizeMax=100000000000000002"
  )

  await screen.findByTestId("size-value")
  expect(screen.getByTestId("size-operator")).toHaveTextContent("between")
  expect(screen.getByTestId("size-value")).toHaveTextContent(
    "100000000000000001,100000000000000002"
  )
  await router.navigate({ to: "/", search: { sizeMin: "20" } })
  await waitFor(() =>
    expect(screen.getByTestId("size-operator")).toHaveTextContent("gte")
  )
  await router.navigate({ to: "/", search: { sizeMax: "30" } })
  await waitFor(() =>
    expect(screen.getByTestId("size-operator")).toHaveTextContent("lte")
  )
})
