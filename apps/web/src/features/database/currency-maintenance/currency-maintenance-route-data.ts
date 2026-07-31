import { createServerFn } from "@tanstack/react-start"
import type { CurrencyOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createCurrencyAuthorizationError,
  hasCurrencyMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    currencies: CurrencyOption[]
  },
  ReturnType<typeof createCurrencyAuthorizationError>
>

export type CurrencyMaintenancePageLoaderData = MaintenancePageLoaderData<{
  currencies: CurrencyOption[]
}>

type ReadDependencies = {
  getCurrencies: () => Promise<CurrencyOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getCurrencies } = await import("@coin-archive/db")

  return {
    getCurrencies,
  }
}

export async function loadCurrencyMaintenanceCurrencies(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasCurrencyMaintenanceAccess(collector)) {
    return createCurrencyAuthorizationError()
  }

  const { getCurrencies } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    currencies: await getCurrencies(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCurrencyMaintenanceCurrencies(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadCurrencyMaintenanceRouteData() {
  return getLoaderData()
}
