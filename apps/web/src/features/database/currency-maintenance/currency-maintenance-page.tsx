import { createServerFn } from "@tanstack/react-start"
import type { CurrencyOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createCurrencyAuthorizationError, hasCurrencyMaintenanceAccess } from "./actions"
import { CurrenciesTable } from "./table-workflow/currencies-table"

type LoadResult =
  | ReturnType<typeof createCurrencyAuthorizationError>
  | {
      status: "success"
      currencies: CurrencyOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      currencies: CurrencyOption[]
    }

type ReadDependencies = {
  getCurrencies: () => Promise<CurrencyOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getCurrencies } = await import("@workspace/db")

  return {
    getCurrencies,
  }
}

function toLoaderData(result: Awaited<LoadResult>): LoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    currencies: result.currencies,
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

  return toLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <CurrenciesTable currencies={loaderData.currencies} />
    </main>
  )
}
