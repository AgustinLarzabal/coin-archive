import { createServerFn } from "@tanstack/react-start"
import type { CurrencyOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  type MaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import { createCurrencyAuthorizationError, hasCurrencyMaintenanceAccess } from "./actions"
import { CurrenciesTable } from "./table-workflow/currencies-table"

type LoadResult = MaintenancePageLoadResult<{
  currencies: CurrencyOption[]
}, ReturnType<typeof createCurrencyAuthorizationError>>

type LoaderData = MaintenancePageLoaderData<{
  currencies: CurrencyOption[]
}>

type ReadDependencies = {
  getCurrencies: () => Promise<CurrencyOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getCurrencies } = await import("@workspace/db")

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

type CurrencyMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function CurrencyMaintenanceRouteComponent({
  loaderData,
}: CurrencyMaintenanceRouteComponentProps) {
  return renderCurrencyMaintenancePage(loaderData)
}

export function renderCurrencyMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ currencies }) => (
    <main className="mt-8">
      <CurrenciesTable currencies={currencies} />
    </main>
  ))
}
