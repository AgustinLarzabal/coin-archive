import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const ROUTE_DIRECTORY_URL = new URL(".", import.meta.url)
type FeatureOwnedRouteAdapter = {
  featureImportPath: string
  filePath: string
  loaderExport: string
  routeComponentExport: string
  loaderDataExpression?: string
}

const FEATURE_OWNED_ROUTE_ADAPTERS = [
  {
    featureImportPath: "@/features/database/coin-maintenance",
    filePath: "coins.$coinId.edit.tsx",
    loaderExport: "loadCoinEditRouteData",
    routeComponentExport: "CoinEditRouteComponent",
  },
  {
    featureImportPath: "@/features/database/coin-maintenance",
    filePath: "coins.tsx",
    loaderExport: "loadCoinMaintenanceRouteData",
    routeComponentExport: "CoinMaintenanceRouteComponent",
    loaderDataExpression: "loaderData",
  },
  {
    featureImportPath: "@/features/database/coin-maintenance",
    filePath: "coins.new.tsx",
    loaderExport: "loadCoinCreateRouteData",
    routeComponentExport: "CoinCreateRouteComponent",
  },
  {
    featureImportPath: "@/features/database/catalogue-maintenance",
    filePath: "catalogues.tsx",
    loaderExport: "loadCatalogueMaintenanceRouteData",
    routeComponentExport: "CatalogueMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/composition-maintenance",
    filePath: "compositions.tsx",
    loaderExport: "loadCompositionMaintenanceRouteData",
    routeComponentExport: "CompositionMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/currency-maintenance",
    filePath: "currencies.tsx",
    loaderExport: "loadCurrencyMaintenanceRouteData",
    routeComponentExport: "CurrencyMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/distribution-maintenance",
    filePath: "distributions.tsx",
    loaderExport: "loadDistributionMaintenanceRouteData",
    routeComponentExport: "DistributionMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/edge-maintenance",
    filePath: "edges.tsx",
    loaderExport: "loadEdgeMaintenanceRouteData",
    routeComponentExport: "EdgeMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/engraver-maintenance",
    filePath: "engravers.tsx",
    loaderExport: "loadEngraverMaintenanceRouteData",
    routeComponentExport: "EngraverMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/overview",
    filePath: "index.tsx",
    loaderExport: "loadDatabaseOverviewRouteData",
    routeComponentExport: "DatabaseOverviewRouteComponent",
  },
  {
    featureImportPath: "@/features/database/issuer-maintenance",
    filePath: "issuers.tsx",
    loaderExport: "loadIssuerMaintenanceRouteData",
    routeComponentExport: "IssuerMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/minting-technique-maintenance",
    filePath: "minting-techniques.tsx",
    loaderExport: "loadMintingTechniqueMaintenanceRouteData",
    routeComponentExport: "MintingTechniqueMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/mint-maintenance",
    filePath: "mints.tsx",
    loaderExport: "loadMintMaintenanceRouteData",
    routeComponentExport: "MintMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/orientation-maintenance",
    filePath: "orientations.tsx",
    loaderExport: "loadOrientationMaintenanceRouteData",
    routeComponentExport: "OrientationMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/rim-maintenance",
    filePath: "rims.tsx",
    loaderExport: "loadRimMaintenanceRouteData",
    routeComponentExport: "RimMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/ruler-group-maintenance",
    filePath: "ruler-groups.tsx",
    loaderExport: "loadRulerGroupMaintenanceRouteData",
    routeComponentExport: "RulerGroupMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/ruler-maintenance",
    filePath: "rulers.tsx",
    loaderExport: "loadRulerMaintenanceRouteData",
    routeComponentExport: "RulerMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/shape-maintenance",
    filePath: "shapes.tsx",
    loaderExport: "loadShapeMaintenanceRouteData",
    routeComponentExport: "ShapeMaintenanceRouteComponent",
  },
  {
    featureImportPath: "@/features/database/theme-maintenance",
    filePath: "themes.tsx",
    loaderExport: "loadThemeMaintenanceRouteData",
    routeComponentExport: "ThemeMaintenanceRouteComponent",
  },
] satisfies readonly FeatureOwnedRouteAdapter[]

function readRouteSource(filePath: string) {
  return readFileSync(new URL(filePath, ROUTE_DIRECTORY_URL), "utf8")
}

describe("database route adapters", () => {
  it("keeps route adapter coverage consolidated at the shared database boundary", () => {
    expect(
      readdirSync(ROUTE_DIRECTORY_URL).filter(
        (filePath) => filePath.startsWith("-") && filePath.endsWith(".test.ts")
      )
    ).toStrictEqual(["-route-adapters.test.ts"])
  })

  it("stay thin and avoid route-owned page render helpers", () => {
    for (const { filePath } of FEATURE_OWNED_ROUTE_ADAPTERS) {
      expect(readRouteSource(filePath)).not.toMatch(
        /export function renderDatabase/
      )
    }
  })

  it("delegate to feature-root public APIs for loader and route component ownership", () => {
    for (const {
      featureImportPath,
      filePath,
      loaderExport,
      routeComponentExport,
      loaderDataExpression = "Route.useLoaderData()",
    } of FEATURE_OWNED_ROUTE_ADAPTERS) {
      const routeSource = readRouteSource(filePath)

      expect(routeSource).toContain(`from "${featureImportPath}"`)
      expect(routeSource).toContain(`loader: ${loaderExport}`)
      expect(routeSource).toContain(
        `<${routeComponentExport} loaderData={${loaderDataExpression}} />`
      )
    }
  })

  it("renders nested Coin routes through the Coins route outlet", () => {
    const routeSource = readRouteSource("coins.tsx")

    expect(routeSource).toContain('pathname === "/database/coins"')
    expect(routeSource).toContain("<Outlet />")
  })
})
