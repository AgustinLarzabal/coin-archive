import { createServerFn } from "@tanstack/react-start"
import type { CoinMaintenanceRecord } from "@workspace/db"
import { z } from "zod"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  getCoinFormOptionsDependencies,
  loadCoinFormOptions,
  type CoinFormOptions,
  type CoinFormOptionsDependencies,
} from "./coin-form.shared"
import {
  renderMaintenancePage,
  toMaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  type MaintenancePageLoaderData,
} from "../maintenance-page"
import { hasCoinMaintenanceAccess } from "./actions"
import { CoinForm } from "./coin-form"

const coinEditLoaderDepsSchema = z.object({
  coinId: z.uuid(),
})

type EditCoinPageData = {
  coin: CoinMaintenanceRecord | null
  options: CoinFormOptions
}

type EditCoinLoaderData = MaintenancePageLoaderData<EditCoinPageData>

type CoinEditLoaderDeps = z.infer<typeof coinEditLoaderDepsSchema>

type EditCoinReadDependencies = CoinFormOptionsDependencies & {
  getCoinMaintenanceRecord: (
    coinId: string
  ) => Promise<CoinMaintenanceRecord | null>
}

async function getDefaultDependencies(): Promise<EditCoinReadDependencies> {
  const [{ getCoinMaintenanceRecord }, formOptionsDependencies] =
    await Promise.all([
      import("@workspace/db"),
      getCoinFormOptionsDependencies(),
    ])

  return {
    getCoinMaintenanceRecord,
    ...formOptionsDependencies,
  }
}

export async function loadCoinEditPageData(
  collector: CollectorWithRole | null,
  loaderDeps: CoinEditLoaderDeps,
  dependencies?: EditCoinReadDependencies
): Promise<MaintenancePageLoadResult<EditCoinPageData>> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return {
      status: "error",
    }
  }

  const resolvedDependencies = dependencies ?? (await getDefaultDependencies())

  const [coin, options] = await Promise.all([
    resolvedDependencies.getCoinMaintenanceRecord(loaderDeps.coinId),
    loadCoinFormOptions(resolvedDependencies),
  ])

  return {
    status: "success",
    coin,
    options,
  }
}

const getCoinEditLoaderData = createServerFn({
  method: "GET",
})
  .inputValidator(coinEditLoaderDepsSchema)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const result = await loadCoinEditPageData(session?.user ?? null, data)

    return toMaintenancePageLoaderData(result)
  })

export function getCoinEditLoaderDeps(params: {
  coinId: string
}): CoinEditLoaderDeps {
  return {
    coinId: params.coinId,
  }
}

export function loadCoinEditRouteData({ deps }: { deps: CoinEditLoaderDeps }) {
  return getCoinEditLoaderData({ data: deps })
}

type CoinEditRouteComponentProps = {
  loaderData: EditCoinLoaderData
}

export function CoinEditRouteComponent({
  loaderData,
}: CoinEditRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ coin, options }) => (
    <main className="mt-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Edit Coin</h1>
        {coin ? (
          <a
            href={`/coins/${coin.id}`}
            className="text-sm underline underline-offset-4"
          >
            View public Coin page
          </a>
        ) : null}
      </header>

      {coin ? (
        <CoinForm mode="edit" coin={coin} options={options} />
      ) : (
        <p className="text-sm text-destructive">Coin no longer exists.</p>
      )}
    </main>
  ))
}
