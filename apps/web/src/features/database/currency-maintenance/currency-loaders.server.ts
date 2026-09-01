import type { Currency } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import type { MaintenancePageLoadResult } from "../maintenance-page"
import { createCurrencyAuthorizationError } from "./actions"
import type { CurrencyMaintenanceReadDependencies } from "./currency-maintenance-route-data"

type LoadResult = MaintenancePageLoadResult<
  { currencies: Currency[] },
  ReturnType<typeof createCurrencyAuthorizationError>
>

export async function getCurrencyMaintenanceReadDependencies(): Promise<CurrencyMaintenanceReadDependencies> {
  const client = await getMaintenanceApiClient()
  return { listCurrencies: client.currencies.list }
}

export async function loadCurrencyMaintenanceCurrencies(
  dependencies: CurrencyMaintenanceReadDependencies
): Promise<LoadResult> {
  const currencies: Currency[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await dependencies.listCurrencies({
        ...(cursor === undefined ? {} : { cursor }),
        limit: 100,
        sort: "name",
        order: "asc",
      })
      currencies.push(...page.data)
      cursor = page.nextCursor ?? undefined
      if (cursor !== undefined && seenCursors.has(cursor)) {
        throw new Error("Currency maintenance API repeated a cursor.")
      }
      if (cursor !== undefined) seenCursors.add(cursor)
    } while (cursor !== undefined)
  } catch (error) {
    if (isAuthorizationProblem(error)) {
      return createCurrencyAuthorizationError()
    }
    throw error
  }

  return { status: "success", currencies }
}

function isAuthorizationProblem(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return false
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data)) {
    return false
  }
  const body = data.body
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    (body.code === "authentication_required" ||
      body.code === "editor_access_required")
  )
}
