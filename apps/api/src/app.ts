import {
  browseCoinsInputSchema,
  generateApiOpenApiDocument,
} from "@coin-archive/api"
import type {
  BrowseCoinsInput,
  BrowseCoinsOutput,
  CoinDetail,
  CoinDetailOutput,
} from "@coin-archive/api"
import { Hono } from "hono"

import { registerOrientationMaintenanceRoutes } from "./orientation-maintenance"
import type {
  MaintenanceCollector,
  OrientationMaintenanceDependencies,
} from "./orientation-maintenance"
import { registerCatalogueMaintenanceRoutes } from "./catalogue-maintenance"
import type { CatalogueMaintenanceDependencies } from "./catalogue-maintenance"
import { registerCompositionMaintenanceRoutes } from "./composition-maintenance"
import type { CompositionMaintenanceDependencies } from "./composition-maintenance"
import { registerCurrencyMaintenanceRoutes } from "./currency-maintenance"
import type { CurrencyMaintenanceDependencies } from "./currency-maintenance"
import { registerDistributionMaintenanceRoutes } from "./distribution-maintenance"
import type { DistributionMaintenanceDependencies } from "./distribution-maintenance"
import { registerEdgeMaintenanceRoutes } from "./edge-maintenance"
import type { EdgeMaintenanceDependencies } from "./edge-maintenance"
import { registerRimMaintenanceRoutes } from "./rim-maintenance"
import type { RimMaintenanceDependencies } from "./rim-maintenance"
import { registerShapeMaintenanceRoutes } from "./shape-maintenance"
import type { ShapeMaintenanceDependencies } from "./shape-maintenance"
import { registerEngraverMaintenanceRoutes } from "./engraver-maintenance"
import type { EngraverMaintenanceDependencies } from "./engraver-maintenance"
import { registerThemeMaintenanceRoutes } from "./theme-maintenance"
import type { ThemeMaintenanceDependencies } from "./theme-maintenance"
import { registerIssuerMaintenanceRoutes } from "./issuer-maintenance"
import type { IssuerMaintenanceDependencies } from "./issuer-maintenance"
import { registerMintingTechniqueMaintenanceRoutes } from "./minting-technique-maintenance"
import type { MintingTechniqueMaintenanceDependencies } from "./minting-technique-maintenance"
import { registerMintMaintenanceRoutes } from "./mint-maintenance"
import type { MintMaintenanceDependencies } from "./mint-maintenance"
import { registerRulerGroupMaintenanceRoutes } from "./ruler-group-maintenance"
import type { RulerGroupMaintenanceDependencies } from "./ruler-group-maintenance"
import { registerRulerMaintenanceRoutes } from "./ruler-maintenance"
import type { RulerMaintenanceDependencies } from "./ruler-maintenance"
import { registerDatabaseMaintenanceOverviewRoutes } from "./database-maintenance-overview"
import type { DatabaseMaintenanceOverviewDependencies } from "./database-maintenance-overview"
import { registerCoinMaintenanceRoutes } from "./coin-maintenance"
import type { CoinMaintenanceDependencies } from "./coin-maintenance"
import { registerSurfaceImageUploadMaintenanceRoutes } from "./surface-image-upload-maintenance"
import type { SurfaceImageUploadMaintenanceDependencies } from "./surface-image-upload-maintenance"

const cacheControl =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
const queryNames = [
  "q",
  "issuer",
  "ruler",
  "theme",
  "engraver",
  "distribution",
  "cursor",
  "limit",
] as const

type CoinSource = {
  id: string
  title: string
  createdAt: Date
  issuer: { code: string; isoCode: string; name: string }
  surfaces: {
    obverse: { imageUrl: string | null } | null
    reverse: { imageUrl: string | null } | null
    edge: { imageUrl: string | null } | null
  }
}

export type BrowseCoins = (
  input: Omit<BrowseCoinsInput, "cursor"> & {
    cursor?: { createdAt: Date; id: string }
  }
) => Promise<CoinSource[]>

type CoinDetailSource = {
  id: string
  title: string
  comments: string | null
  composition: { code: string; name: string }
  compositionDescription: string | null
  diameter: number | string | null
  distribution: { code: string; name: string }
  edge: { code: string; name: string } | null
  faceValue: {
    text: string
    numericValue: number | string
    currency: { code: string; name: string; fullName: string }
  }
  isDemonetized: boolean | null
  issuer: { code: string; isoCode: string; name: string }
  minYear: number | null
  maxYear: number | null
  mintage: number | string | null
  mints: { code: string; name: string }[]
  orientation: { code: string; name: string } | null
  references: { catalogue: { code: string; title: string }; number: string }[]
  rim: { code: string; name: string } | null
  rulers: { code: string; name: string }[]
  shape: { code: string; name: string } | null
  surfaces: {
    obverse: CoinFaceSurface | null
    reverse: CoinFaceSurface | null
    edge: CoinEdgeSurface | null
  }
  technique: { code: string; name: string } | null
  themes: { code: string; name: string }[]
  thickness: number | string | null
  weight: number | string | null
}

type CoinEdgeSurface = {
  description: string | null
  lettering: string | null
  imageUrl: string | null
}

type CoinFaceSurface = CoinEdgeSurface & {
  engravers?: { code: string; name: string }[]
}

export type GetCoin = (id: string) => Promise<CoinDetailSource | null>

export type HandleAuthRequest = (request: Request) => Promise<Response>

export type OperationalLogEntry = {
  durationMs: number
  method: string
  outcome?: "unexpected_error"
  requestId: string
  route: string
  status: number
}

export function createApiApp({
  browseCoins,
  getCoin = async () => null,
  environment,
  surfaceImageOrigin,
  rateLimit = async () => true,
  handleAuthRequest,
  getCollector = async () => null,
  maintenanceRateLimit = async () => true,
  getDatabaseMaintenanceOverview = async () => {
    throw new Error("Database Maintenance overview is not configured")
  },
  listMaintenanceCoins = async () => [],
  getMaintenanceCoin = async () => null,
  getMaintenanceCoinDeleteSummary = async () => null,
  getCoinMaintenanceOptions = async () => ({
    catalogues: [],
    compositions: [],
    currencies: [],
    distributions: [],
    edges: [],
    engravers: [],
    issuers: [],
    mints: [],
    orientations: [],
    rims: [],
    rulers: [],
    shapes: [],
    mintingTechniques: [],
    themes: [],
  }),
  completeMaintenanceCoinCreate = async () => {
    throw new Error("Coin create is not configured")
  },
  replaceMaintenanceCoin = async () => {
    throw new Error("Coin replacement is not configured")
  },
  deleteMaintenanceCoin = async () => {
    throw new Error("Coin deletion is not configured")
  },
  reserveMaintenanceCoinCreate = async () => ({ status: "reserved" }),
  releaseCoinCreateResources = async () => true,
  claimSurfaceImageUpload = async () => true,
  releaseSurfaceImageUploadClaim = async () => {},
  prepareSurfaceImageUpload = async () => {
    throw new Error("Surface Image preparation is not configured")
  },
  finalizeSurfaceImageUpload = async () => {},
  deletePublishedSurfaceImage = async () => {},
  recordSurfaceImageCleanupFailures = async () => {},
  listOrientations = async () => [],
  getOrientation = async () => null,
  createOrientation = async () => {
    throw new Error("Orientation create is not configured")
  },
  replaceOrientation = async () => {
    throw new Error("Orientation replacement is not configured")
  },
  deleteOrientation = async () => {
    throw new Error("Orientation deletion is not configured")
  },
  listCatalogues = async () => [],
  getCatalogue = async () => null,
  createCatalogue = async () => {
    throw new Error("Catalogue create is not configured")
  },
  replaceCatalogue = async () => {
    throw new Error("Catalogue replacement is not configured")
  },
  deleteCatalogue = async () => {
    throw new Error("Catalogue deletion is not configured")
  },
  listCompositions = async () => [],
  getComposition = async () => null,
  createComposition = async () => {
    throw new Error("Composition create is not configured")
  },
  replaceComposition = async () => {
    throw new Error("Composition replacement is not configured")
  },
  deleteComposition = async () => {
    throw new Error("Composition deletion is not configured")
  },
  listDistributions = async () => [],
  getDistribution = async () => null,
  createDistribution = async () => {
    throw new Error("Distribution create is not configured")
  },
  replaceDistribution = async () => {
    throw new Error("Distribution replacement is not configured")
  },
  deleteDistribution = async () => {
    throw new Error("Distribution deletion is not configured")
  },
  listEdges = async () => [],
  getEdge = async () => null,
  createEdge = async () => {
    throw new Error("Edge create is not configured")
  },
  replaceEdge = async () => {
    throw new Error("Edge replacement is not configured")
  },
  deleteEdge = async () => {
    throw new Error("Edge deletion is not configured")
  },
  listRims = async () => [],
  getRim = async () => null,
  createRim = async () => {
    throw new Error("Rim create is not configured")
  },
  replaceRim = async () => {
    throw new Error("Rim replacement is not configured")
  },
  deleteRim = async () => {
    throw new Error("Rim deletion is not configured")
  },
  listShapes = async () => [],
  getShape = async () => null,
  createShape = async () => {
    throw new Error("Shape create is not configured")
  },
  replaceShape = async () => {
    throw new Error("Shape replacement is not configured")
  },
  deleteShape = async () => {
    throw new Error("Shape deletion is not configured")
  },
  listEngravers = async () => [],
  getEngraver = async () => null,
  createEngraver = async () => {
    throw new Error("Engraver create is not configured")
  },
  replaceEngraver = async () => {
    throw new Error("Engraver replacement is not configured")
  },
  deleteEngraver = async () => {
    throw new Error("Engraver deletion is not configured")
  },
  listThemes = async () => [],
  getTheme = async () => null,
  createTheme = async () => {
    throw new Error("Theme create is not configured")
  },
  replaceTheme = async () => {
    throw new Error("Theme replacement is not configured")
  },
  deleteTheme = async () => {
    throw new Error("Theme deletion is not configured")
  },
  listIssuers = async () => [],
  getIssuer = async () => null,
  createIssuer = async () => {
    throw new Error("Issuer create is not configured")
  },
  replaceIssuer = async () => {
    throw new Error("Issuer replacement is not configured")
  },
  deleteIssuer = async () => {
    throw new Error("Issuer deletion is not configured")
  },
  listMintingTechniques = async () => [],
  getMintingTechnique = async () => null,
  createMintingTechnique = async () => {
    throw new Error("Minting Technique create is not configured")
  },
  replaceMintingTechnique = async () => {
    throw new Error("Minting Technique replacement is not configured")
  },
  deleteMintingTechnique = async () => {
    throw new Error("Minting Technique deletion is not configured")
  },
  listMints = async () => [],
  getMint = async () => null,
  createMint = async () => {
    throw new Error("Mint create is not configured")
  },
  replaceMint = async () => {
    throw new Error("Mint replacement is not configured")
  },
  deleteMint = async () => {
    throw new Error("Mint deletion is not configured")
  },
  listRulerGroups = async () => [],
  getRulerGroup = async () => null,
  createRulerGroup = async () => {
    throw new Error("Ruler Group create is not configured")
  },
  replaceRulerGroup = async () => {
    throw new Error("Ruler Group replacement is not configured")
  },
  deleteRulerGroup = async () => {
    throw new Error("Ruler Group deletion is not configured")
  },
  listRulers = async () => [],
  getRuler = async () => null,
  createRuler = async () => {
    throw new Error("Ruler create is not configured")
  },
  replaceRuler = async () => {
    throw new Error("Ruler replacement is not configured")
  },
  deleteRuler = async () => {
    throw new Error("Ruler deletion is not configured")
  },
  listCurrencies = async () => [],
  getCurrency = async () => null,
  createCurrency = async () => {
    throw new Error("Currency create is not configured")
  },
  replaceCurrency = async () => {
    throw new Error("Currency replacement is not configured")
  },
  deleteCurrency = async () => {
    throw new Error("Currency deletion is not configured")
  },
  authorizeSurfaceImageUpload = async () => {
    throw new Error("Surface Image upload authorization is not configured")
  },
  cancelSurfaceImageUpload = async () => {
    throw new Error("Surface Image upload cancellation is not configured")
  },
  trustProxyHeaders = false,
  createRequestId = () => crypto.randomUUID(),
  now = () => Date.now(),
  writeLog,
}: {
  browseCoins: BrowseCoins
  getCoin?: GetCoin
  environment: "staging" | "production"
  surfaceImageOrigin: string
  rateLimit?: (clientIp: string) => Promise<boolean>
  handleAuthRequest?: HandleAuthRequest
  getCollector?: (request: Request) => Promise<MaintenanceCollector | null>
  maintenanceRateLimit?: (
    collectorId: string,
    kind: "mutation" | "read",
    clientIp?: string
  ) => Promise<boolean>
  getDatabaseMaintenanceOverview?: DatabaseMaintenanceOverviewDependencies["getDatabaseMaintenanceOverview"]
  listMaintenanceCoins?: CoinMaintenanceDependencies["listMaintenanceCoins"]
  getMaintenanceCoin?: CoinMaintenanceDependencies["getMaintenanceCoin"]
  getMaintenanceCoinDeleteSummary?: CoinMaintenanceDependencies["getMaintenanceCoinDeleteSummary"]
  getCoinMaintenanceOptions?: CoinMaintenanceDependencies["getCoinMaintenanceOptions"]
  reserveMaintenanceCoinCreate?: CoinMaintenanceDependencies["reserveMaintenanceCoinCreate"]
  completeMaintenanceCoinCreate?: CoinMaintenanceDependencies["completeMaintenanceCoinCreate"]
  replaceMaintenanceCoin?: CoinMaintenanceDependencies["replaceMaintenanceCoin"]
  deleteMaintenanceCoin?: CoinMaintenanceDependencies["deleteMaintenanceCoin"]
  releaseCoinCreateResources?: CoinMaintenanceDependencies["releaseCoinCreateResources"]
  claimSurfaceImageUpload?: CoinMaintenanceDependencies["claimSurfaceImageUpload"]
  releaseSurfaceImageUploadClaim?: CoinMaintenanceDependencies["releaseSurfaceImageUploadClaim"]
  prepareSurfaceImageUpload?: CoinMaintenanceDependencies["prepareSurfaceImageUpload"]
  finalizeSurfaceImageUpload?: CoinMaintenanceDependencies["finalizeSurfaceImageUpload"]
  deletePublishedSurfaceImage?: CoinMaintenanceDependencies["deletePublishedSurfaceImage"]
  recordSurfaceImageCleanupFailures?: CoinMaintenanceDependencies["recordSurfaceImageCleanupFailures"]
  listOrientations?: OrientationMaintenanceDependencies["listOrientations"]
  getOrientation?: OrientationMaintenanceDependencies["getOrientation"]
  createOrientation?: OrientationMaintenanceDependencies["createOrientation"]
  replaceOrientation?: OrientationMaintenanceDependencies["replaceOrientation"]
  deleteOrientation?: OrientationMaintenanceDependencies["deleteOrientation"]
  listCatalogues?: CatalogueMaintenanceDependencies["listCatalogues"]
  getCatalogue?: CatalogueMaintenanceDependencies["getCatalogue"]
  createCatalogue?: CatalogueMaintenanceDependencies["createCatalogue"]
  replaceCatalogue?: CatalogueMaintenanceDependencies["replaceCatalogue"]
  deleteCatalogue?: CatalogueMaintenanceDependencies["deleteCatalogue"]
  listCompositions?: CompositionMaintenanceDependencies["listCompositions"]
  getComposition?: CompositionMaintenanceDependencies["getComposition"]
  createComposition?: CompositionMaintenanceDependencies["createComposition"]
  replaceComposition?: CompositionMaintenanceDependencies["replaceComposition"]
  deleteComposition?: CompositionMaintenanceDependencies["deleteComposition"]
  listDistributions?: DistributionMaintenanceDependencies["listDistributions"]
  getDistribution?: DistributionMaintenanceDependencies["getDistribution"]
  createDistribution?: DistributionMaintenanceDependencies["createDistribution"]
  replaceDistribution?: DistributionMaintenanceDependencies["replaceDistribution"]
  deleteDistribution?: DistributionMaintenanceDependencies["deleteDistribution"]
  listEdges?: EdgeMaintenanceDependencies["listEdges"]
  getEdge?: EdgeMaintenanceDependencies["getEdge"]
  createEdge?: EdgeMaintenanceDependencies["createEdge"]
  replaceEdge?: EdgeMaintenanceDependencies["replaceEdge"]
  deleteEdge?: EdgeMaintenanceDependencies["deleteEdge"]
  listRims?: RimMaintenanceDependencies["listRims"]
  getRim?: RimMaintenanceDependencies["getRim"]
  createRim?: RimMaintenanceDependencies["createRim"]
  replaceRim?: RimMaintenanceDependencies["replaceRim"]
  deleteRim?: RimMaintenanceDependencies["deleteRim"]
  listShapes?: ShapeMaintenanceDependencies["listShapes"]
  getShape?: ShapeMaintenanceDependencies["getShape"]
  createShape?: ShapeMaintenanceDependencies["createShape"]
  replaceShape?: ShapeMaintenanceDependencies["replaceShape"]
  deleteShape?: ShapeMaintenanceDependencies["deleteShape"]
  listEngravers?: EngraverMaintenanceDependencies["listEngravers"]
  getEngraver?: EngraverMaintenanceDependencies["getEngraver"]
  createEngraver?: EngraverMaintenanceDependencies["createEngraver"]
  replaceEngraver?: EngraverMaintenanceDependencies["replaceEngraver"]
  deleteEngraver?: EngraverMaintenanceDependencies["deleteEngraver"]
  listThemes?: ThemeMaintenanceDependencies["listThemes"]
  getTheme?: ThemeMaintenanceDependencies["getTheme"]
  createTheme?: ThemeMaintenanceDependencies["createTheme"]
  replaceTheme?: ThemeMaintenanceDependencies["replaceTheme"]
  deleteTheme?: ThemeMaintenanceDependencies["deleteTheme"]
  listIssuers?: IssuerMaintenanceDependencies["listIssuers"]
  getIssuer?: IssuerMaintenanceDependencies["getIssuer"]
  createIssuer?: IssuerMaintenanceDependencies["createIssuer"]
  replaceIssuer?: IssuerMaintenanceDependencies["replaceIssuer"]
  deleteIssuer?: IssuerMaintenanceDependencies["deleteIssuer"]
  listMintingTechniques?: MintingTechniqueMaintenanceDependencies["listMintingTechniques"]
  getMintingTechnique?: MintingTechniqueMaintenanceDependencies["getMintingTechnique"]
  createMintingTechnique?: MintingTechniqueMaintenanceDependencies["createMintingTechnique"]
  replaceMintingTechnique?: MintingTechniqueMaintenanceDependencies["replaceMintingTechnique"]
  deleteMintingTechnique?: MintingTechniqueMaintenanceDependencies["deleteMintingTechnique"]
  listMints?: MintMaintenanceDependencies["listMints"]
  getMint?: MintMaintenanceDependencies["getMint"]
  createMint?: MintMaintenanceDependencies["createMint"]
  replaceMint?: MintMaintenanceDependencies["replaceMint"]
  deleteMint?: MintMaintenanceDependencies["deleteMint"]
  listRulerGroups?: RulerGroupMaintenanceDependencies["listRulerGroups"]
  getRulerGroup?: RulerGroupMaintenanceDependencies["getRulerGroup"]
  createRulerGroup?: RulerGroupMaintenanceDependencies["createRulerGroup"]
  replaceRulerGroup?: RulerGroupMaintenanceDependencies["replaceRulerGroup"]
  deleteRulerGroup?: RulerGroupMaintenanceDependencies["deleteRulerGroup"]
  listRulers?: RulerMaintenanceDependencies["listRulers"]
  getRuler?: RulerMaintenanceDependencies["getRuler"]
  createRuler?: RulerMaintenanceDependencies["createRuler"]
  replaceRuler?: RulerMaintenanceDependencies["replaceRuler"]
  deleteRuler?: RulerMaintenanceDependencies["deleteRuler"]
  listCurrencies?: CurrencyMaintenanceDependencies["listCurrencies"]
  getCurrency?: CurrencyMaintenanceDependencies["getCurrency"]
  createCurrency?: CurrencyMaintenanceDependencies["createCurrency"]
  replaceCurrency?: CurrencyMaintenanceDependencies["replaceCurrency"]
  deleteCurrency?: CurrencyMaintenanceDependencies["deleteCurrency"]
  authorizeSurfaceImageUpload?: SurfaceImageUploadMaintenanceDependencies["authorizeSurfaceImageUpload"]
  cancelSurfaceImageUpload?: SurfaceImageUploadMaintenanceDependencies["cancelSurfaceImageUpload"]
  trustProxyHeaders?: boolean
  createRequestId?: () => string
  now?: () => number
  writeLog?: (entry: OperationalLogEntry) => void
}) {
  const app = new Hono<{
    Variables: { collector: MaintenanceCollector; requestId: string }
  }>()
  const allowedOrigin =
    environment === "production"
      ? "https://coinarchive.app"
      : "https://staging.coinarchive.app"

  app.onError((_error, context) =>
    context.req.path.startsWith("/api/v1/maintenance/")
      ? maintenanceProblemResponse(
          500,
          "Internal Server Error",
          "The maintenance request could not be completed",
          context.req.path
        )
      : context.text("Internal Server Error", 500)
  )

  app.use("*", async (context, next) => {
    const startedAt = now()
    const requestId = trustProxyHeaders
      ? (context.req.header("x-request-id") ?? createRequestId())
      : createRequestId()
    context.set("requestId", requestId)

    await next()

    const response = context.res
    if (
      context.req.path.startsWith("/api/v1/maintenance/") &&
      response.headers.get("content-type")?.includes("application/problem+json")
    ) {
      const problem: unknown = await response.clone().json()
      context.res = new Response(
        JSON.stringify(
          typeof problem === "object" && problem !== null
            ? { ...problem, requestId }
            : { requestId }
        ),
        {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
        }
      )
    }
    context.header("X-Request-ID", requestId)
    writeLog?.({
      durationMs: Math.max(0, now() - startedAt),
      method: context.req.method,
      ...(context.res.status >= 500
        ? { outcome: "unexpected_error" as const }
        : {}),
      requestId,
      route: context.req.routePath || "unmatched",
      status: context.res.status,
    })
  })

  if (handleAuthRequest !== undefined) {
    app.all("/api/auth/*", async (context) => {
      const requestId = context.get("requestId")
      const headers = new Headers(context.req.raw.headers)
      headers.set("x-request-id", requestId)
      if (!trustProxyHeaders) {
        headers.delete("x-forwarded-for")
        headers.delete("x-forwarded-host")
        headers.delete("x-forwarded-proto")
      }
      const response = await handleAuthRequest(
        new Request(context.req.raw, { headers })
      )
      const responseHeaders = new Headers(response.headers)
      responseHeaders.set("Cache-Control", "private, no-store")
      responseHeaders.set("X-Request-ID", requestId)

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    })
  }

  app.use("/api/v1/*", async (context, next) => {
    if (context.req.path.startsWith("/api/v1/maintenance/")) {
      await next()
      return
    }
    const origin = context.req.header("origin")
    if (origin === allowedOrigin) {
      context.header("Access-Control-Allow-Origin", origin)
      context.header("Vary", "Origin")
    }
    if (context.req.method === "OPTIONS") {
      return context.body(null, 204, {
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
    }

    const clientIp = context.req.header("CF-Connecting-IP") ?? "unknown"
    if (!(await rateLimit(clientIp))) {
      const response = problemResponse(
        429,
        "Too Many Requests",
        "Rate limit exceeded",
        "/api/v1/coins",
        undefined,
        { "Retry-After": "60" }
      )
      if (origin === allowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", origin)
        response.headers.set("Vary", "Origin")
      }
      return response
    }
    await next()
  })

  app.use("/api/v1/maintenance/*", async (context, next) => {
    const collector = await getCollector(context.req.raw)
    if (collector === null) {
      return maintenanceProblemResponse(
        401,
        "Authentication required",
        "A valid Collector session is required",
        context.req.path
      )
    }
    if (collector.role !== "editor" && collector.role !== "admin") {
      return maintenanceProblemResponse(
        403,
        "Editor access required",
        "This Collector does not have Editor access",
        context.req.path
      )
    }
    const requestKind =
      context.req.method === "GET" || context.req.method === "HEAD"
        ? "read"
        : "mutation"
    const directClientIp = trustProxyHeaders
      ? undefined
      : context.req.header("cf-connecting-ip")
    const allowed =
      directClientIp === undefined
        ? await maintenanceRateLimit(collector.id, requestKind)
        : await maintenanceRateLimit(collector.id, requestKind, directClientIp)
    if (!allowed) {
      return maintenanceProblemResponse(
        429,
        "Too Many Requests",
        `Maintenance ${requestKind} rate limit exceeded`,
        context.req.path,
        { "Retry-After": "60" }
      )
    }

    context.set("collector", collector)
    await next()
    context.header("Cache-Control", "private, no-store")
  })

  registerOrientationMaintenanceRoutes(app, {
    listOrientations,
    getOrientation,
    createOrientation,
    replaceOrientation,
    deleteOrientation,
  })
  registerSurfaceImageUploadMaintenanceRoutes(app, {
    authorizeSurfaceImageUpload,
    cancelSurfaceImageUpload,
  })
  registerDatabaseMaintenanceOverviewRoutes(app, {
    getDatabaseMaintenanceOverview,
  })
  registerCoinMaintenanceRoutes(app, {
    listMaintenanceCoins,
    getMaintenanceCoin,
    getMaintenanceCoinDeleteSummary,
    getCoinMaintenanceOptions,
    reserveMaintenanceCoinCreate,
    completeMaintenanceCoinCreate,
    replaceMaintenanceCoin,
    deleteMaintenanceCoin,
    releaseCoinCreateResources,
    claimSurfaceImageUpload,
    releaseSurfaceImageUploadClaim,
    prepareSurfaceImageUpload,
    finalizeSurfaceImageUpload,
    deletePublishedSurfaceImage,
    recordSurfaceImageCleanupFailures,
  })
  registerCatalogueMaintenanceRoutes(app, {
    listCatalogues,
    getCatalogue,
    createCatalogue,
    replaceCatalogue,
    deleteCatalogue,
  })
  registerCompositionMaintenanceRoutes(app, {
    listCompositions,
    getComposition,
    createComposition,
    replaceComposition,
    deleteComposition,
  })
  registerDistributionMaintenanceRoutes(app, {
    listDistributions,
    getDistribution,
    createDistribution,
    replaceDistribution,
    deleteDistribution,
  })
  registerEdgeMaintenanceRoutes(app, {
    listEdges,
    getEdge,
    createEdge,
    replaceEdge,
    deleteEdge,
  })
  registerRimMaintenanceRoutes(app, {
    listRims,
    getRim,
    createRim,
    replaceRim,
    deleteRim,
  })
  registerShapeMaintenanceRoutes(app, {
    listShapes,
    getShape,
    createShape,
    replaceShape,
    deleteShape,
  })
  registerEngraverMaintenanceRoutes(app, {
    listEngravers,
    getEngraver,
    createEngraver,
    replaceEngraver,
    deleteEngraver,
  })
  registerThemeMaintenanceRoutes(app, {
    listThemes,
    getTheme,
    createTheme,
    replaceTheme,
    deleteTheme,
  })
  registerIssuerMaintenanceRoutes(app, {
    listIssuers,
    getIssuer,
    createIssuer,
    replaceIssuer,
    deleteIssuer,
  })
  registerMintingTechniqueMaintenanceRoutes(app, {
    listMintingTechniques,
    getMintingTechnique,
    createMintingTechnique,
    replaceMintingTechnique,
    deleteMintingTechnique,
  })
  registerMintMaintenanceRoutes(app, {
    listMints,
    getMint,
    createMint,
    replaceMint,
    deleteMint,
  })
  registerRulerGroupMaintenanceRoutes(app, {
    listRulerGroups,
    getRulerGroup,
    createRulerGroup,
    replaceRulerGroup,
    deleteRulerGroup,
  })
  registerRulerMaintenanceRoutes(app, {
    listRulers,
    getRuler,
    createRuler,
    replaceRuler,
    deleteRuler,
  })
  registerCurrencyMaintenanceRoutes(app, {
    listCurrencies,
    getCurrency,
    createCurrency,
    replaceCurrency,
    deleteCurrency,
  })

  app.all("/api/v1/maintenance/*", (context) =>
    maintenanceProblemResponse(
      404,
      "Maintenance route not found",
      "No maintenance operation matches this path",
      context.req.path,
      {},
      "maintenance_route_not_found",
      "maintenance-route-not-found"
    )
  )

  app.on(["GET", "HEAD"], "/api/v1/coins", async (context) => {
    const input = parseBrowseInput(context.req.url)
    if (input instanceof Response) {
      return input
    }
    const records = await browseCoins(input)
    const page = records.slice(0, input.limit ?? 30)
    const last = page.at(-1)
    const nextCursor =
      records.length > page.length && last !== undefined
        ? encodeCursor(last)
        : null
    const body: BrowseCoinsOutput = {
      data: page.map((coin) => ({
        id: coin.id,
        title: coin.title,
        issuer: coin.issuer,
        surfaceImages: {
          obverse: safeImageUrl(
            coin.surfaces.obverse?.imageUrl,
            surfaceImageOrigin
          ),
          reverse: safeImageUrl(
            coin.surfaces.reverse?.imageUrl,
            surfaceImageOrigin
          ),
          edge: safeImageUrl(coin.surfaces.edge?.imageUrl, surfaceImageOrigin),
        },
        detailUrl: new URL(
          `/api/v1/coins/${coin.id}`,
          context.req.url
        ).toString(),
      })),
      nextCursor,
    }
    const serialized = JSON.stringify(body)
    const etag = `"${await digest(serialized)}"`
    const headers = { "Cache-Control": cacheControl, ETag: etag }
    if (context.req.header("If-None-Match") === etag) {
      return context.body(null, 304, headers)
    }
    return context.req.method === "HEAD"
      ? context.body(null, 200, headers)
      : context.body(serialized, 200, {
          ...headers,
          "Content-Type": "application/json",
        })
  })

  app.all("/api/v1/coins", (context) =>
    problemResponse(
      405,
      "Method Not Allowed",
      "Only GET, HEAD, and OPTIONS are supported",
      "/api/v1/coins",
      undefined,
      { Allow: "GET, HEAD, OPTIONS" }
    )
  )

  app.on(["GET", "HEAD"], "/api/v1/coins/:uuid", async (context) => {
    const uuid = context.req.param("uuid")
    if (!isUuid(uuid)) {
      return problemResponse(
        400,
        "Invalid Coin UUID",
        "Coin UUID is invalid",
        context.req.path,
        [{ name: "uuid", reason: "does not match UUID format" }]
      )
    }
    const coin = await getCoin(uuid)
    if (coin === null) {
      return problemResponse(
        404,
        "Coin not found",
        "No Coin matches this UUID",
        context.req.path
      )
    }
    const body: CoinDetailOutput = {
      data: mapCoinDetail(coin, surfaceImageOrigin),
    }
    const serialized = JSON.stringify(body)
    const etag = `"${await digest(serialized)}"`
    const headers = { "Cache-Control": cacheControl, ETag: etag }
    if (context.req.header("If-None-Match") === etag)
      return context.body(null, 304, headers)
    return context.req.method === "HEAD"
      ? context.body(null, 200, headers)
      : context.body(serialized, 200, {
          ...headers,
          "Content-Type": "application/json",
        })
  })

  app.all("/api/v1/coins/:uuid", (context) =>
    problemResponse(
      405,
      "Method Not Allowed",
      "Only GET, HEAD, and OPTIONS are supported",
      context.req.path,
      undefined,
      { Allow: "GET, HEAD, OPTIONS" }
    )
  )

  app.get("/api/v1/openapi.json", async (context) => {
    const document = await generateApiOpenApiDocument()
    return context.json(document, 200, { "Cache-Control": cacheControl })
  })

  return app
}

function maintenanceProblemResponse(
  status: number,
  title: string,
  detail: string,
  instance: string,
  headers: Record<string, string> = {},
  code = maintenanceProblemCode(status),
  type = String(status)
) {
  const response = problemResponse(
    status,
    title,
    detail,
    instance,
    undefined,
    headers,
    code,
    type
  )
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

function maintenanceProblemCode(status: number) {
  switch (status) {
    case 400:
      return "invalid_request"
    case 401:
      return "authentication_required"
    case 403:
      return "editor_access_required"
    case 404:
      return "orientation_not_found"
    case 405:
      return "method_not_allowed"
    case 429:
      return "rate_limit_exceeded"
    default:
      return "internal_error"
  }
}

function parseBrowseInput(url: string):
  | (Omit<BrowseCoinsInput, "cursor"> & {
      cursor?: { createdAt: Date; id: string }
    })
  | Response {
  const requestUrl = new URL(url)
  for (const name of requestUrl.searchParams.keys()) {
    if (!queryNames.includes(name as (typeof queryNames)[number])) {
      return problemResponse(
        400,
        "Invalid query parameters",
        `Query parameter '${name}' is not supported`,
        "/api/v1/coins",
        [{ name, reason: "unsupported" }]
      )
    }
  }
  for (const name of queryNames) {
    const values = requestUrl.searchParams.getAll(name)
    if (values.length > 1 || values.some((value) => value.trim() === "")) {
      return problemResponse(
        400,
        "Invalid query parameters",
        `Query parameter '${name}' must appear once and cannot be blank`,
        "/api/v1/coins",
        [{ name, reason: "blank or repeated" }]
      )
    }
  }
  const raw = Object.fromEntries(
    queryNames.flatMap((name) => {
      const value = requestUrl.searchParams.get(name)
      if (value === null) return []
      return [[name, name === "limit" ? Number(value) : value]]
    })
  )
  const parsed = browseCoinsInputSchema.safeParse(raw)
  if (!parsed.success)
    return problemResponse(
      400,
      "Invalid query parameters",
      "Query parameters do not match the public API contract",
      "/api/v1/coins",
      [{ name: "query", reason: "does not match contract" }]
    )
  const cursor =
    parsed.data.cursor === undefined
      ? undefined
      : decodeCursor(parsed.data.cursor)
  if (parsed.data.cursor !== undefined && cursor === undefined) {
    return problemResponse(
      400,
      "Invalid query parameters",
      "Cursor is invalid",
      "/api/v1/coins",
      [{ name: "cursor", reason: "invalid" }]
    )
  }
  return { ...parsed.data, cursor }
}

function safeImageUrl(
  value: string | null | undefined,
  expectedOrigin: string
) {
  if (value === null || value === undefined) return null
  try {
    return new URL(value).origin === expectedOrigin ? value : null
  } catch {
    return null
  }
}

function mapCoinDetail(
  coin: CoinDetailSource,
  surfaceImageOrigin: string
): CoinDetail {
  const mapEdgeSurface = (surface: CoinEdgeSurface | null) =>
    surface === null
      ? null
      : {
          description: surface.description,
          lettering: surface.lettering,
          imageUrl: safeImageUrl(surface.imageUrl, surfaceImageOrigin),
        }
  const mapFaceSurface = (surface: CoinFaceSurface | null) =>
    surface === null
      ? null
      : {
          description: surface.description,
          lettering: surface.lettering,
          imageUrl: safeImageUrl(surface.imageUrl, surfaceImageOrigin),
          engravers: surface.engravers ?? [],
        }
  const decimal = (value: number | string | null) => value?.toString() ?? null
  return {
    ...coin,
    issuer: {
      code: coin.issuer.code,
      isoCode: coin.issuer.isoCode,
      name: coin.issuer.name,
    },
    faceValue: {
      ...coin.faceValue,
      numericValue: coin.faceValue.numericValue.toString(),
    },
    diameter: decimal(coin.diameter),
    mintage: decimal(coin.mintage),
    thickness: decimal(coin.thickness),
    weight: decimal(coin.weight),
    surfaces: {
      obverse: mapFaceSurface(coin.surfaces.obverse),
      reverse: mapFaceSurface(coin.surfaces.reverse),
      edge: mapEdgeSurface(coin.surfaces.edge),
    },
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function encodeCursor(coin: Pick<CoinSource, "createdAt" | "id">) {
  return btoa(
    JSON.stringify({ createdAt: coin.createdAt.toISOString(), id: coin.id })
  )
}

function decodeCursor(value: string) {
  try {
    const decoded: unknown = JSON.parse(atob(value))
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "createdAt" in decoded &&
      "id" in decoded &&
      typeof decoded.createdAt === "string" &&
      typeof decoded.id === "string"
    ) {
      const createdAt = new Date(decoded.createdAt)
      return Number.isNaN(createdAt.valueOf())
        ? undefined
        : { createdAt, id: decoded.id }
    }
  } catch {}
  return undefined
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function problemResponse(
  status: number,
  title: string,
  detail: string,
  instance: string,
  invalidParams?: Array<{ name: string; reason: string }>,
  headers: Record<string, string> = {},
  code?: string,
  type = String(status)
) {
  return new Response(
    JSON.stringify({
      type: `https://api.coinarchive.app/problems/${type}`,
      title,
      status,
      detail,
      instance,
      ...(code === undefined ? {} : { code }),
      ...(invalidParams === undefined ? {} : { invalidParams }),
    }),
    {
      status,
      headers: { "Content-Type": "application/problem+json", ...headers },
    }
  )
}
