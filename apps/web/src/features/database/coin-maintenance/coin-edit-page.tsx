import { createServerFn } from "@tanstack/react-start"
import type {
  CoinMaintenanceRecord,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  EdgeOption,
  IssuerOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
} from "@workspace/db"
import { z } from "zod"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import type { CoinFormOptions } from "./coin-form.shared"
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

type EditCoinReadDependencies = {
  getCoinMaintenanceRecord: (
    coinId: string
  ) => Promise<CoinMaintenanceRecord | null>
  getCompositions: () => Promise<CompositionOption[]>
  getCurrencies: () => Promise<CurrencyOption[]>
  getDistributions: () => Promise<DistributionOption[]>
  getEdges: () => Promise<EdgeOption[]>
  getIssuers: () => Promise<IssuerOption[]>
  getOrientations: () => Promise<OrientationOption[]>
  getRims: () => Promise<RimOption[]>
  getRulers: () => Promise<RulerOption[]>
  getShapes: () => Promise<ShapeOption[]>
  getTechniques: () => Promise<TechniqueOption[]>
}

async function getDefaultDependencies(): Promise<EditCoinReadDependencies> {
  const {
    getCoinMaintenanceRecord,
    getCompositions,
    getCurrencies,
    getDistributions,
    getEdges,
    getIssuers,
    getOrientations,
    getRims,
    getRulers,
    getShapes,
    getTechniques,
  } = await import("@workspace/db")

  return {
    getCoinMaintenanceRecord,
    getCompositions,
    getCurrencies,
    getDistributions,
    getEdges,
    getIssuers,
    getOrientations,
    getRims,
    getRulers,
    getShapes,
    getTechniques,
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

  const [
    coin,
    issuers,
    rulers,
    distributions,
    compositions,
    currencies,
    orientations,
    shapes,
    techniques,
    edges,
    rims,
  ] = await Promise.all([
    resolvedDependencies.getCoinMaintenanceRecord(loaderDeps.coinId),
    resolvedDependencies.getIssuers(),
    resolvedDependencies.getRulers(),
    resolvedDependencies.getDistributions(),
    resolvedDependencies.getCompositions(),
    resolvedDependencies.getCurrencies(),
    resolvedDependencies.getOrientations(),
    resolvedDependencies.getShapes(),
    resolvedDependencies.getTechniques(),
    resolvedDependencies.getEdges(),
    resolvedDependencies.getRims(),
  ])

  return {
    status: "success",
    coin,
    options: {
      issuers,
      rulers,
      distributions,
      compositions,
      currencies,
      orientations,
      shapes,
      techniques,
      edges,
      rims,
    },
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
