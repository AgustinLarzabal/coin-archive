import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type { ExploreFilterValue } from "@/features/explore/filters/explore-filter-definitions"
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
    query,
    onQueryChange,
    onBeforeQueryChange,
  }: {
    fields: FilterField<ExploreFilterValue>[]
    query: FilterQuery<ExploreFilterValue>
    onQueryChange: (query: FilterQuery<ExploreFilterValue>) => void
    onBeforeQueryChange: (
      query: FilterQuery<ExploreFilterValue>
    ) => boolean | void
  }) => (
    <>
      <output data-testid="fields">
        {fields.map((field) => field.id).join(",")}
      </output>
      <output data-testid="rule-count">{query.rules.length}</output>
      <output data-testid="mint-options">
        {fields
          .find((field) => field.id === "mint")
          ?.options?.map(({ label }) => label)
          .join("|")}
      </output>
      <output data-testid="ruler-options">
        {fields
          .find((field) => field.id === "ruler")
          ?.options?.map(({ label }) => label)
          .join("|")}
      </output>
      <output data-testid="currency-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "currency"
          )?.value
        }
      </output>
      <output data-testid="issuer-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "issuer"
          )?.value
        }
      </output>
      <output data-testid="distribution-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "distribution"
          )?.value
        }
      </output>
      <output data-testid="tag-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "tag"
          )?.value
        }
      </output>
      <output data-testid="tag-operator">
        {
          query.rules.find(
            (node): node is FilterRule<ExploreFilterValue> =>
              node.type === "rule" && node.path[0] === "tag"
          )?.operator
        }
      </output>
      <output data-testid="tag-operators">
        {(() => {
          const operators = fields.find(
            (field) => field.id === "tag"
          )?.operators
          return Array.isArray(operators)
            ? operators.map(({ value }) => value).join("|")
            : ""
        })()}
      </output>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((node) =>
              node.type === "rule" && node.path[0] === "tag"
                ? { ...node, operator: "has_any_of" }
                : node
            ),
          })
        }
      >
        Match any Tag
      </button>
      <output data-testid="orientation-options">
        {fields
          .find((field) => field.id === "orientation")
          ?.options?.map(({ label }) => label)
          .join("|")}
      </output>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules,
              {
                type: "rule",
                id: "test-orientation",
                path: ["orientation"],
                operator: "is",
                value: "medal",
              },
            ],
          })
        }
      >
        Select Orientation
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "orientation"
            ),
          })
        }
      >
        Clear Orientation
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules.filter(
                (node) => node.type !== "rule" || node.path[0] !== "tag"
              ),
              {
                type: "rule",
                id: "test-tag",
                path: ["tag"],
                operator: "has_all_of",
                value: ["map"],
              },
            ],
          })
        }
      >
        Select tag
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((node) =>
              node.type === "rule" && node.path[0] === "tag"
                ? { ...node, value: ["map", "flag"] }
                : node
            ),
          })
        }
      >
        Add Flag
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((node) =>
              node.type === "rule" && node.path[0] === "tag"
                ? { ...node, value: ["map"] }
                : node
            ),
          })
        }
      >
        Remove Flag
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.map((node) =>
              node.type === "rule" && node.path[0] === "tag"
                ? { ...node, value: [] }
                : node
            ),
          })
        }
      >
        Remove last Tag
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "tag"
            ),
          })
        }
      >
        Clear tag
      </button>
      <output data-testid="composition-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "composition"
          )?.value
        }
      </output>
      <output data-testid="mint-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "mint"
          )?.value
        }
      </output>
      <output data-testid="engraver-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "engraver"
          )?.value
        }
      </output>
      <output data-testid="ruler-value">
        {
          query.rules.find(
            (node): node is FilterRule<string> =>
              node.type === "rule" && node.path[0] === "ruler"
          )?.value
        }
      </output>
      <button
        type="button"
        onClick={() => {
          const next = {
            ...query,
            rules: [
              ...query.rules,
              {
                type: "rule" as const,
                id: "pending-issuer",
                path: ["issuer"],
                operator: "is",
                value: undefined,
              },
            ],
          }
          if (onBeforeQueryChange(next) !== false) onQueryChange(next)
        }}
      >
        Add incomplete issuer
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules.filter(
                (node) => node.type !== "rule" || node.path[0] !== "ruler"
              ),
              {
                type: "rule",
                id: "test-ruler",
                path: ["ruler"],
                operator: "is",
                value: "roman-republic",
              },
            ],
          })
        }
      >
        Select ruler
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "ruler"
            ),
          })
        }
      >
        Clear ruler
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules.filter(
                (node) => node.type !== "rule" || node.path[0] !== "engraver"
              ),
              {
                type: "rule",
                id: "test-engraver",
                path: ["engraver"],
                operator: "is",
                value: "first-engraver",
              },
            ],
          })
        }
      >
        Select engraver
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "engraver"
            ),
          })
        }
      >
        Clear engraver
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules.filter(
                (node) => node.type !== "rule" || node.path[0] !== "mint"
              ),
              {
                type: "rule",
                id: "test-mint",
                path: ["mint"],
                operator: "is",
                value: "buenos-aires",
              },
            ],
          })
        }
      >
        Select mint
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "mint"
            ),
          })
        }
      >
        Clear mint
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules.filter(
                (node) => node.type !== "rule" || node.path[0] !== "currency"
              ),
              {
                type: "rule",
                id: "test-currency",
                path: ["currency"],
                operator: "is",
                value: "argentine-peso",
              },
            ],
          })
        }
      >
        Select currency
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "currency"
            ),
          })
        }
      >
        Clear currency
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules.filter(
                (node) =>
                  node.type !== "rule" || node.path[0] !== "distribution"
              ),
              {
                type: "rule",
                id: "test-distribution",
                path: ["distribution"],
                operator: "is",
                value: "standard-circulation",
              },
            ],
          })
        }
      >
        Select distribution
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              ...query.rules,
              {
                type: "rule",
                id: "test-composition",
                path: ["composition"],
                operator: "is",
                value: "bimetallic",
              },
            ],
          })
        }
      >
        Select composition
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: query.rules.filter(
              (node) => node.type !== "rule" || node.path[0] !== "distribution"
            ),
          })
        }
      >
        Clear distribution
      </button>
      <button
        type="button"
        onClick={() =>
          onQueryChange({
            ...query,
            rules: [
              {
                type: "rule",
                id: "test-issuer",
                path: ["issuer"],
                operator: "is",
                value: "AR",
              },
            ],
          })
        }
      >
        Select issuer
      </button>
      <button
        type="button"
        onClick={() => {
          const next = {
            ...query,
            rules: [
              {
                type: "rule" as const,
                id: "test-issuer",
                path: ["issuer"],
                operator: "is",
                value: "invalid issuer",
              },
            ],
          }
          if (onBeforeQueryChange(next) !== false) onQueryChange(next)
        }}
      >
        Select invalid issuer
      </button>
      <button
        type="button"
        onClick={() => onQueryChange({ ...query, rules: [] })}
      >
        Clear issuer
      </button>
    </>
  ),
}))

it("combines all Explore filters and syncs them with the URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        currencies: [
          { slug: "argentine-peso", name: "Peso", fullName: "Argentine peso" },
        ],
        issuers: [{ code: "AR", name: "Argentina" }],
        mints: [
          {
            slug: "buenos-aires",
            name: "National Mint",
            place: "Buenos Aires",
            country: { code: "AR", name: "Argentina" },
          },
          {
            slug: "cordoba",
            name: "National Mint",
            place: "Córdoba",
            country: { code: "AR", name: "Argentina" },
          },
        ],
        distributions: [
          { slug: "standard-circulation", name: "Standard circulation" },
        ],
        compositions: [{ slug: "bimetallic", name: "Bimetallic" }],
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        rulers: [
          {
            slug: "roman-republic",
            name: "Rome",
            role: "Period",
            tenure: null,
          },
          { slug: "roman-empire", name: "Rome", role: "Period", tenure: null },
        ],
      })
    )
  )
  const router = renderArchiveRoute("/")

  expect(await screen.findByTestId("fields")).toHaveTextContent(
    "amount,currency,composition,shape,orientation,distribution,technique,engraver,issuer,mint,ruler,tag,size,thickness,weight,year"
  )
  expect(screen.getByTestId("mint-options")).toHaveTextContent(
    "National Mint (Buenos Aires, Argentina; buenos-aires)"
  )
  expect(screen.getByTestId("mint-options")).toHaveTextContent(
    "National Mint (Córdoba, Argentina; cordoba)"
  )
  expect(screen.getByTestId("ruler-options")).toHaveTextContent(
    "Rome (roman-republic)"
  )
  expect(screen.getByTestId("ruler-options")).toHaveTextContent(
    "Rome (roman-empire)"
  )
  fireEvent.click(screen.getByRole("button", { name: "Add incomplete issuer" }))
  expect(screen.getByTestId("rule-count")).toHaveTextContent("1")
  expect(router.state.location.search.issuer).toBeUndefined()

  fireEvent.click(screen.getByRole("button", { name: "Select issuer" }))
  await waitFor(() => expect(router.state.location.search.issuer).toBe("AR"))
  expect(screen.getByTestId("issuer-value")).toHaveTextContent("AR")

  fireEvent.click(screen.getByRole("button", { name: "Select invalid issuer" }))
  expect(screen.getByTestId("issuer-value")).toHaveTextContent("AR")
  expect(router.state.location.search.issuer).toBe("AR")

  fireEvent.click(screen.getByRole("button", { name: "Select distribution" }))
  await waitFor(() =>
    expect(router.state.location.search.distribution).toBe(
      "standard-circulation"
    )
  )
  expect(screen.getByTestId("distribution-value")).toHaveTextContent(
    "standard-circulation"
  )

  fireEvent.click(screen.getByRole("button", { name: "Select composition" }))
  await waitFor(() =>
    expect(router.state.location.search.composition).toBe("bimetallic")
  )
  expect(screen.getByTestId("composition-value")).toHaveTextContent(
    "bimetallic"
  )

  fireEvent.click(screen.getByRole("button", { name: "Select currency" }))
  await waitFor(() =>
    expect(router.state.location.search.currency).toBe("argentine-peso")
  )
  expect(screen.getByTestId("currency-value")).toHaveTextContent(
    "argentine-peso"
  )

  fireEvent.click(screen.getByRole("button", { name: "Select mint" }))
  await waitFor(() =>
    expect(router.state.location.search.mint).toBe("buenos-aires")
  )
  expect(screen.getByTestId("mint-value")).toHaveTextContent("buenos-aires")

  fireEvent.click(screen.getByRole("button", { name: "Select engraver" }))
  await waitFor(() =>
    expect(router.state.location.search.engraver).toBe("first-engraver")
  )
  expect(screen.getByTestId("engraver-value")).toHaveTextContent(
    "first-engraver"
  )

  fireEvent.click(screen.getByRole("button", { name: "Select ruler" }))
  await waitFor(() =>
    expect(router.state.location.search.ruler).toBe("roman-republic")
  )
  expect(screen.getByTestId("ruler-value")).toHaveTextContent("roman-republic")

  fireEvent.click(screen.getByRole("button", { name: "Clear ruler" }))
  await waitFor(() =>
    expect(router.state.location.search.ruler).toBeUndefined()
  )
  expect(router.state.location.search.engraver).toBe("first-engraver")

  fireEvent.click(screen.getByRole("button", { name: "Clear engraver" }))
  await waitFor(() =>
    expect(router.state.location.search.engraver).toBeUndefined()
  )
  expect(router.state.location.search.mint).toBe("buenos-aires")

  fireEvent.click(screen.getByRole("button", { name: "Clear mint" }))
  await waitFor(() => expect(router.state.location.search.mint).toBeUndefined())
  expect(router.state.location.search.currency).toBe("argentine-peso")

  fireEvent.click(screen.getByRole("button", { name: "Clear currency" }))
  await waitFor(() =>
    expect(router.state.location.search.currency).toBeUndefined()
  )
  expect(router.state.location.search.distribution).toBe("standard-circulation")
  expect(router.state.location.search.issuer).toBe("AR")

  fireEvent.click(screen.getByRole("button", { name: "Clear distribution" }))
  await waitFor(() =>
    expect(router.state.location.search.distribution).toBeUndefined()
  )
  expect(router.state.location.search.issuer).toBe("AR")

  fireEvent.click(screen.getByRole("button", { name: "Clear issuer" }))
  await waitFor(() =>
    expect(router.state.location.search.issuer).toBeUndefined()
  )
  expect(screen.getByTestId("issuer-value")).toBeEmptyDOMElement()
})

it("adds and removes individual Tags while resetting pagination", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      tags: [
        { slug: "map", name: "Map" },
        { slug: "flag", name: "Flag" },
      ],
      pagination: { page: 2, pageSize: 24, totalItems: 50, totalPages: 3 },
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?page=2")

  await screen.findByTestId("fields")
  fireEvent.click(screen.getByRole("button", { name: "Select tag" }))
  await waitFor(() => expect(router.state.location.search.tag).toBe("map"))
  expect(router.state.location.search.page).toBeUndefined()
  expect(screen.getByTestId("tag-value")).toHaveTextContent("map")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?tag=map&page=1&pageSize=24"
  )

  fireEvent.click(screen.getByRole("button", { name: "Add Flag" }))
  await waitFor(() =>
    expect(router.state.location.search.tag).toEqual(["map", "flag"])
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?tag=map&tag=flag&page=1&pageSize=24"
  )
  fireEvent.click(screen.getByRole("button", { name: "Remove Flag" }))
  await waitFor(() => expect(router.state.location.search.tag).toBe("map"))

  fireEvent.click(screen.getByRole("button", { name: "Remove last Tag" }))
  await waitFor(() => expect(router.state.location.search.tag).toBeUndefined())

  fireEvent.click(screen.getByRole("button", { name: "Select tag" }))
  await waitFor(() => expect(router.state.location.search.tag).toBe("map"))
  fireEvent.click(screen.getByRole("button", { name: "Clear tag" }))
  await waitFor(() => expect(router.state.location.search.tag).toBeUndefined())
})

it("switches selected Tags to any, resets the page, and restores the shared URL", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      tags: [
        { slug: "map", name: "Map" },
        { slug: "flag", name: "Flag" },
      ],
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?tag=map&tag=flag&page=2")
  await screen.findByTestId("tag-operator")
  expect(screen.getByTestId("tag-operators")).toHaveTextContent(
    "has_all_of|has_any_of"
  )
  fireEvent.click(screen.getByRole("button", { name: "Match any Tag" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({
      tag: ["map", "flag"],
      tagMatch: "any",
    })
  )
  expect(router.state.location.search.page).toBeUndefined()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?tag=map&tag=flag&tagMatch=any&page=1&pageSize=24"
  )
  expect(screen.getByTestId("tag-operator")).toHaveTextContent("has_any_of")
})

it("selects and clears Medal Orientation through the URL", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?page=2")
  await screen.findByTestId("orientation-options")
  expect(screen.getByTestId("orientation-options")).toHaveTextContent(
    "Medal|Coin"
  )
  fireEvent.click(screen.getByRole("button", { name: "Select Orientation" }))
  await waitFor(() =>
    expect(router.state.location.search.orientation).toBe("medal")
  )
  expect(router.state.location.search.page).toBeUndefined()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?orientation=medal&page=1&pageSize=24"
  )
  fireEvent.click(screen.getByRole("button", { name: "Clear Orientation" }))
  await waitFor(() =>
    expect(router.state.location.search.orientation).toBeUndefined()
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?page=1&pageSize=24"
  )
})
