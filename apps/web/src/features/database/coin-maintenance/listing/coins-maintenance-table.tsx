import type {
  CoinMaintenanceListResult,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  IssuerOption,
  RulerOption,
} from "@coin-archive/db"

import type { CoinMaintenanceSearch } from "./coin-maintenance-page"

type CoinMaintenanceFilterOptions = {
  issuers: IssuerOption[]
  rulers: RulerOption[]
  distributions: DistributionOption[]
  currencies: CurrencyOption[]
  compositions: CompositionOption[]
}

type CoinsMaintenanceTableProps = {
  search: CoinMaintenanceSearch
  list: CoinMaintenanceListResult
  filterOptions: CoinMaintenanceFilterOptions
}

type SearchParamValue = string | number | undefined

function buildCoinMaintenanceHref(
  search: CoinMaintenanceSearch,
  page: number | undefined = search.page
) {
  const params = new URLSearchParams()

  appendSearchParam(params, "title", search.title)
  appendSearchParam(params, "issuer", search.issuer)
  appendSearchParam(params, "ruler", search.ruler)
  appendSearchParam(params, "distribution", search.distribution)
  appendSearchParam(params, "currency", search.currency)
  appendSearchParam(params, "composition", search.composition)
  appendSearchParam(params, "page", page)

  const queryString = params.toString()

  return queryString === ""
    ? "/database/coins"
    : `/database/coins?${queryString}`
}

function appendSearchParam(
  params: URLSearchParams,
  key: string,
  value: SearchParamValue
) {
  if (value === undefined || value === "") {
    return
  }

  params.set(key, String(value))
}

function formatIssueYearRange(minYear: number | null, maxYear: number | null) {
  if (minYear === null || maxYear === null) {
    return "Unknown"
  }

  return minYear === maxYear ? String(minYear) : `${minYear}-${maxYear}`
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function renderFilterOptions(
  options: Array<{ code: string; name: string }>,
  name: string,
  selectedCode: string | undefined,
  label: string
) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={selectedCode ?? ""}
        className="rounded border px-3 py-2"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function CoinsMaintenanceTable({
  search,
  list,
  filterOptions,
}: CoinsMaintenanceTableProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Coin Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            {list.totalItems} coin{list.totalItems === 1 ? "" : "s"} found.
          </p>
        </div>
        <a
          href="/database/coins/new"
          className="rounded border px-4 py-2 text-sm font-medium"
        >
          Create Coin
        </a>
      </div>

      <form
        method="get"
        action="/database/coins"
        className="grid gap-4 rounded border p-4 md:grid-cols-3"
      >
        <label className="grid gap-1 text-sm md:col-span-3">
          <span>Coin Title</span>
          <input
            type="search"
            name="title"
            defaultValue={search.title ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        {renderFilterOptions(
          filterOptions.issuers,
          "issuer",
          search.issuer,
          "Issuer"
        )}
        {renderFilterOptions(filterOptions.rulers, "ruler", search.ruler, "Ruler")}
        {renderFilterOptions(
          filterOptions.distributions,
          "distribution",
          search.distribution,
          "Distribution"
        )}
        {renderFilterOptions(
          filterOptions.currencies,
          "currency",
          search.currency,
          "Currency"
        )}
        {renderFilterOptions(
          filterOptions.compositions,
          "composition",
          search.composition,
          "Composition"
        )}
        <div className="flex items-end gap-3 md:col-span-3">
          <button type="submit" className="rounded border px-4 py-2 text-sm">
            Apply Filters
          </button>
          <a href="/database/coins" className="text-sm underline underline-offset-4">
            Clear
          </a>
        </div>
      </form>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-4 font-medium">Coin Title</th>
            <th className="py-2 pr-4 font-medium">Issuer</th>
            <th className="py-2 pr-4 font-medium">Issue Year Range</th>
            <th className="py-2 pr-4 font-medium">Face Value</th>
            <th className="py-2 pr-4 font-medium">Distribution</th>
            <th className="py-2 pr-4 font-medium">Composition</th>
            <th className="py-2 pr-4 font-medium">Updated</th>
            <th className="py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {list.items.length === 0 ? (
            <tr>
              <td className="py-6 text-sm text-muted-foreground" colSpan={8}>
                No matching coins found.
              </td>
            </tr>
          ) : (
            list.items.map((coin) => (
              <tr key={coin.id} className="border-b last:border-b-0">
                <td className="py-3 pr-4">
                  <a
                    href={`/database/coins/${coin.id}/edit`}
                    className="underline underline-offset-4"
                  >
                    {coin.title}
                  </a>
                </td>
                <td className="py-3 pr-4">{coin.issuer.name}</td>
                <td className="py-3 pr-4">
                  {formatIssueYearRange(coin.minYear, coin.maxYear)}
                </td>
                <td className="py-3 pr-4">
                  {coin.faceValue.text} ({coin.faceValue.currency.name})
                </td>
                <td className="py-3 pr-4">{coin.distribution.name}</td>
                <td className="py-3 pr-4">{coin.composition.name}</td>
                <td className="py-3 pr-4">{formatDate(coin.updatedAt)}</td>
                <td className="py-3">{formatDate(coin.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between text-sm">
        <span>
          Page {list.page} of {list.totalPages === 0 ? 1 : list.totalPages}
        </span>
        <div className="flex gap-4">
          {list.hasPreviousPage ? (
            <a href={buildCoinMaintenanceHref(search, list.page - 1)}>Previous</a>
          ) : (
            <span aria-disabled="true">Previous</span>
          )}
          {list.hasNextPage ? (
            <a href={buildCoinMaintenanceHref(search, list.page + 1)}>Next</a>
          ) : (
            <span aria-disabled="true">Next</span>
          )}
        </div>
      </div>
    </div>
  )
}
