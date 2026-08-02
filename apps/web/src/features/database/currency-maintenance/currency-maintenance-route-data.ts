import type { Currency, MaintenanceApiClient } from "@coin-archive/api"
import { createServerFn } from "@tanstack/react-start"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createCurrencyAuthorizationError } from "./actions"

type LoadResult = MaintenancePageLoadResult<
  { currencies: Currency[] },
  ReturnType<typeof createCurrencyAuthorizationError>
>

export type CurrencyMaintenancePageLoaderData = MaintenancePageLoaderData<{
  currencies: Currency[]
}>

type ReadDependencies = {
  listCurrencies: MaintenanceApiClient["currencies"]["list"]
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { listCurrencies: client.currencies.list }
}

export async function loadCurrencyMaintenancePageData(
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  const { listCurrencies } =
    dependencies ?? (await getDefaultReadDependencies())
  const currencies: Currency[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  try {
    do {
      const page = await listCurrencies({
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

const getLoaderData = createServerFn({ method: "GET" }).handler(async () =>
  toMaintenancePageLoaderData(await loadCurrencyMaintenancePageData())
)

export function loadCurrencyMaintenanceRouteData() {
  return getLoaderData()
}

function isAuthorizationProblem(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")
  )
}
