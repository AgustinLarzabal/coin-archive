import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { CurrencyOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { CurrenciesTable } from "@/components/tables/currencies/currencies-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type CurrencyAuthorizationErrorResult,
  createCurrencyAuthorizationError,
  hasCurrencyMaintenanceAccess,
} from "@/lib/currency-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadCurrencyMaintenanceCurrenciesResult =
  | CurrencyAuthorizationErrorResult
  | {
      status: "success"
      currencies: CurrencyOption[]
    }

type CurrencyMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      currencies: CurrencyOption[]
    }

type CurrencyReadDependencies = {
  getCurrencies: () => Promise<CurrencyOption[]>
}

async function getDefaultCurrencyReadDependencies(): Promise<CurrencyReadDependencies> {
  const { getCurrencies } = await import("@workspace/db")

  return {
    getCurrencies,
  }
}

export async function loadCurrencyMaintenanceCurrencies(
  collector: CollectorWithRole | null,
  dependencies?: CurrencyReadDependencies
): Promise<LoadCurrencyMaintenanceCurrenciesResult> {
  if (!hasCurrencyMaintenanceAccess(collector)) {
    return createCurrencyAuthorizationError()
  }

  const { getCurrencies } =
    dependencies ?? (await getDefaultCurrencyReadDependencies())

  return {
    status: "success",
    currencies: await getCurrencies(),
  }
}

const getCurrencyMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCurrencyMaintenanceCurrencies(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies CurrencyMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    currencies: result.currencies,
  } satisfies CurrencyMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/currencies")({
  loader: () => getCurrencyMaintenanceLoaderData(),
  component: DatabaseCurrenciesComponent,
})

function DatabaseCurrenciesComponent() {
  const loaderData = Route.useLoaderData()

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
