import { createServerFn } from "@tanstack/react-start"
import type {
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

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  hasRequiredCoinLookupOptions,
  type CoinFormOptions,
} from "./coin-form.shared"
import {
  renderMaintenancePage,
  toMaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  type MaintenancePageLoaderData,
} from "../maintenance-page"
import { hasCoinMaintenanceAccess } from "./actions"
import { CoinForm } from "./coin-form"

type CreateCoinPageData = {
  options: CoinFormOptions
}

type CreateCoinLoaderData = MaintenancePageLoaderData<CreateCoinPageData>

type CreateCoinReadDependencies = {
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

const REQUIRED_LOOKUP_LINKS = [
  ["/database/issuers", "Issuers"],
  ["/database/rulers", "Rulers"],
  ["/database/distributions", "Distributions"],
  ["/database/compositions", "Compositions"],
  ["/database/currencies", "Currencies"],
] as const

async function getDefaultDependencies(): Promise<CreateCoinReadDependencies> {
  const {
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

export async function loadCoinCreatePageData(
  collector: CollectorWithRole | null,
  dependencies?: CreateCoinReadDependencies
): Promise<MaintenancePageLoadResult<CreateCoinPageData>> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return {
      status: "error",
    }
  }

  const resolvedDependencies = dependencies ?? (await getDefaultDependencies())

  const [
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

const getCoinCreateLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCoinCreatePageData(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadCoinCreateRouteData() {
  return getCoinCreateLoaderData()
}

type CoinCreateRouteComponentProps = {
  loaderData: CreateCoinLoaderData
}

export function CoinCreateRouteComponent({
  loaderData,
}: CoinCreateRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ options }) => (
    <main className="mt-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Create Coin</h1>
        <p className="text-sm text-muted-foreground">
          Enter the required core fields and optional scalar details.
        </p>
      </header>

      {hasRequiredCoinLookupOptions(options) ? (
        <CoinForm mode="create" options={options} />
      ) : (
        <div className="space-y-3 rounded border p-4">
          <p className="text-sm">
            Coin creation is blocked until the required lookup records exist.
          </p>
          <ul className="list-disc pl-5 text-sm">
            {REQUIRED_LOOKUP_LINKS.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="underline underline-offset-4">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  ))
}
