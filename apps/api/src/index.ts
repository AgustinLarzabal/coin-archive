import {
  createCatalogueIdempotentlyWithDatabase,
  createCompositionIdempotentlyWithDatabase,
  createCurrencyIdempotentlyWithDatabase,
  createDistributionIdempotentlyWithDatabase,
  createEdgeIdempotentlyWithDatabase,
  createEngraverIdempotentlyWithDatabase,
  createIssuerIdempotentlyWithDatabase,
  createThemeIdempotentlyWithDatabase,
  createRulerGroupIdempotentlyWithDatabase,
  createRimIdempotentlyWithDatabase,
  createShapeIdempotentlyWithDatabase,
  createTechniqueIdempotentlyWithDatabase,
  createOrientationIdempotentlyWithDatabase,
  createDatabase,
  deleteCatalogueIfVersionWithDatabase,
  deleteCompositionIfVersionWithDatabase,
  deleteCurrencyIfVersionWithDatabase,
  deleteDistributionIfVersionWithDatabase,
  deleteEdgeIfVersionWithDatabase,
  deleteEngraverIfVersionWithDatabase,
  deleteIssuerIfVersionWithDatabase,
  deleteThemeIfVersionWithDatabase,
  deleteRulerGroupIfVersionWithDatabase,
  deleteRimIfVersionWithDatabase,
  deleteShapeIfVersionWithDatabase,
  deleteTechniqueIfVersionWithDatabase,
  deleteOrientationIfVersionWithDatabase,
  getCatalogueMaintenanceRecordWithDatabase,
  getCatalogueMaintenanceRecordsWithDatabase,
  getCompositionMaintenanceRecordWithDatabase,
  getCompositionMaintenanceRecordsWithDatabase,
  getCurrencyMaintenanceRecordWithDatabase,
  getCurrencyMaintenanceRecordsWithDatabase,
  getDistributionMaintenanceRecordWithDatabase,
  getDistributionMaintenanceRecordsWithDatabase,
  getEdgeMaintenanceRecordWithDatabase,
  getEdgeMaintenanceRecordsWithDatabase,
  getEngraverMaintenanceRecordWithDatabase,
  getEngraverMaintenanceRecordsWithDatabase,
  getIssuerMaintenanceRecordWithDatabase,
  getIssuerMaintenanceRecordsWithDatabase,
  getThemeMaintenanceRecordWithDatabase,
  getThemeMaintenanceRecordsWithDatabase,
  getRulerGroupMaintenanceRecordWithDatabase,
  getRulerGroupMaintenanceRecordsWithDatabase,
  getRimMaintenanceRecordWithDatabase,
  getRimMaintenanceRecordsWithDatabase,
  getShapeMaintenanceRecordWithDatabase,
  getShapeMaintenanceRecordsWithDatabase,
  getTechniqueMaintenanceRecordWithDatabase,
  getTechniqueMaintenanceRecordsWithDatabase,
  getOrientationMaintenanceRecordWithDatabase,
  getOrientationMaintenanceRecordsWithDatabase,
  getPublicCoinWithDatabase,
  getCoinsWithDatabase,
  replaceCatalogueWithDatabase,
  replaceCompositionWithDatabase,
  replaceCurrencyWithDatabase,
  replaceDistributionWithDatabase,
  replaceEdgeWithDatabase,
  replaceEngraverWithDatabase,
  replaceIssuerWithDatabase,
  replaceThemeWithDatabase,
  replaceRulerGroupWithDatabase,
  replaceRimWithDatabase,
  replaceShapeWithDatabase,
  replaceTechniqueWithDatabase,
  replaceOrientationWithDatabase,
} from "@coin-archive/db"
import { createAuth, parseTrustedOrigins } from "@coin-archive/auth/server"
import { WorkerEntrypoint } from "cloudflare:workers"
import { createApiApp } from "./app"

export default {
  async fetch(request: Request, env: Env) {
    return handleRequest(request, env, false)
  },
}

export class AuthProxy extends WorkerEntrypoint<Env> {
  override fetch(request: Request) {
    return handleRequest(request, this.env, true)
  }
}

async function handleRequest(
  request: Request,
  env: Env,
  trustProxyHeaders: boolean
) {
  const database = createDatabase(env.DATABASE_URL)
  const auth = createAuth({
    database: database.db,
    environment: {
      betterAuthSecret: env.BETTER_AUTH_SECRET,
      betterAuthUrl: env.BETTER_AUTH_URL,
      trustedOrigins: parseTrustedOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS),
      googleClientId: env.GOOGLE_CLIENT_ID,
      googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  })
  const app = createApiApp({
    trustProxyHeaders,
    environment: env.API_ENVIRONMENT,
    surfaceImageOrigin: env.SURFACE_IMAGE_ORIGIN,
    rateLimit: async (clientIp) =>
      (
        await env.API_RATE_LIMITER.limit({
          key: `${env.API_ENVIRONMENT}:${clientIp}`,
        })
      ).success,
    maintenanceRateLimit: async (collectorId, kind, clientIp) => {
      const limiter =
        kind === "read"
          ? env.MAINTENANCE_READ_RATE_LIMITER
          : env.MAINTENANCE_MUTATION_RATE_LIMITER
      const collectorResult = await limiter.limit({
        key: `${env.API_ENVIRONMENT}:collector:${collectorId}`,
      })
      if (!collectorResult.success || clientIp === undefined) {
        return collectorResult.success
      }
      return (
        await limiter.limit({
          key: `${env.API_ENVIRONMENT}:ip:${clientIp}`,
        })
      ).success
    },
    browseCoins: async (input) =>
      (
        await getCoinsWithDatabase(database.db, {
          distributionCode: input.distribution,
          engraverCode: input.engraver,
          issuerCode: input.issuer,
          rulerCode: input.ruler,
          themeCode: input.theme,
          titleSearch: input.q,
          cursor: input.cursor,
          limit: (input.limit ?? 30) + 1,
        })
      ).filter(
        (coin): coin is typeof coin & { createdAt: Date } =>
          coin.createdAt !== undefined
      ),
    getCoin: (coinId) => getPublicCoinWithDatabase(database.db, coinId),
    listCatalogues: (input) =>
      getCatalogueMaintenanceRecordsWithDatabase(database.db, input),
    getCatalogue: (catalogueId) =>
      getCatalogueMaintenanceRecordWithDatabase(database.db, catalogueId),
    createCatalogue: (input) =>
      createCatalogueIdempotentlyWithDatabase(database.db, input),
    replaceCatalogue: ({ id, expectedVersion, fields }) =>
      replaceCatalogueWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteCatalogue: (input) =>
      deleteCatalogueIfVersionWithDatabase(database.db, input),
    listCompositions: (input) =>
      getCompositionMaintenanceRecordsWithDatabase(database.db, input),
    getComposition: (compositionId) =>
      getCompositionMaintenanceRecordWithDatabase(database.db, compositionId),
    createComposition: (input) =>
      createCompositionIdempotentlyWithDatabase(database.db, input),
    replaceComposition: ({ id, expectedVersion, fields }) =>
      replaceCompositionWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteComposition: (input) =>
      deleteCompositionIfVersionWithDatabase(database.db, input),
    listDistributions: (input) =>
      getDistributionMaintenanceRecordsWithDatabase(database.db, input),
    getDistribution: (distributionId) =>
      getDistributionMaintenanceRecordWithDatabase(database.db, distributionId),
    createDistribution: (input) =>
      createDistributionIdempotentlyWithDatabase(database.db, input),
    replaceDistribution: ({ id, expectedVersion, fields }) =>
      replaceDistributionWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteDistribution: (input) =>
      deleteDistributionIfVersionWithDatabase(database.db, input),
    listEdges: (input) =>
      getEdgeMaintenanceRecordsWithDatabase(database.db, input),
    getEdge: (edgeId) =>
      getEdgeMaintenanceRecordWithDatabase(database.db, edgeId),
    createEdge: (input) =>
      createEdgeIdempotentlyWithDatabase(database.db, input),
    replaceEdge: ({ id, expectedVersion, fields }) =>
      replaceEdgeWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteEdge: (input) => deleteEdgeIfVersionWithDatabase(database.db, input),
    listEngravers: (input) =>
      getEngraverMaintenanceRecordsWithDatabase(database.db, input),
    getEngraver: (engraverId) =>
      getEngraverMaintenanceRecordWithDatabase(database.db, engraverId),
    createEngraver: (input) =>
      createEngraverIdempotentlyWithDatabase(database.db, input),
    replaceEngraver: ({ id, expectedVersion, fields }) =>
      replaceEngraverWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteEngraver: (input) =>
      deleteEngraverIfVersionWithDatabase(database.db, input),
    listThemes: (input) =>
      getThemeMaintenanceRecordsWithDatabase(database.db, input),
    getTheme: (themeId) =>
      getThemeMaintenanceRecordWithDatabase(database.db, themeId),
    createTheme: (input) =>
      createThemeIdempotentlyWithDatabase(database.db, input),
    replaceTheme: ({ id, expectedVersion, fields }) =>
      replaceThemeWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteTheme: (input) =>
      deleteThemeIfVersionWithDatabase(database.db, input),
    listIssuers: (input) =>
      getIssuerMaintenanceRecordsWithDatabase(database.db, input),
    getIssuer: (issuerId) =>
      getIssuerMaintenanceRecordWithDatabase(database.db, issuerId),
    createIssuer: (input) =>
      createIssuerIdempotentlyWithDatabase(database.db, input),
    replaceIssuer: ({ id, expectedVersion, fields }) =>
      replaceIssuerWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteIssuer: (input) =>
      deleteIssuerIfVersionWithDatabase(database.db, input),
    listRims: (input) =>
      getRimMaintenanceRecordsWithDatabase(database.db, input),
    getRim: (rimId) => getRimMaintenanceRecordWithDatabase(database.db, rimId),
    createRim: (input) => createRimIdempotentlyWithDatabase(database.db, input),
    replaceRim: ({ id, expectedVersion, fields }) =>
      replaceRimWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteRim: (input) => deleteRimIfVersionWithDatabase(database.db, input),
    listShapes: (input) =>
      getShapeMaintenanceRecordsWithDatabase(database.db, input),
    getShape: (shapeId) =>
      getShapeMaintenanceRecordWithDatabase(database.db, shapeId),
    createShape: (input) =>
      createShapeIdempotentlyWithDatabase(database.db, input),
    replaceShape: ({ id, expectedVersion, fields }) =>
      replaceShapeWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteShape: (input) =>
      deleteShapeIfVersionWithDatabase(database.db, input),
    listMintingTechniques: (input) =>
      getTechniqueMaintenanceRecordsWithDatabase(database.db, input),
    getMintingTechnique: (mintingTechniqueId) =>
      getTechniqueMaintenanceRecordWithDatabase(
        database.db,
        mintingTechniqueId
      ),
    createMintingTechnique: async (input) => {
      const result = await createTechniqueIdempotentlyWithDatabase(
        database.db,
        input
      )
      return result.status === "mismatch"
        ? result
        : { status: result.status, mintingTechnique: result.technique }
    },
    replaceMintingTechnique: async ({ id, expectedVersion, fields }) => {
      const result = await replaceTechniqueWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      })
      return result.status === "updated"
        ? { status: result.status, mintingTechnique: result.technique }
        : result
    },
    deleteMintingTechnique: async (input) => {
      const result = await deleteTechniqueIfVersionWithDatabase(
        database.db,
        input
      )
      return result.status === "deleted"
        ? { status: result.status, mintingTechnique: result.technique }
        : result
    },
    listRulerGroups: (input) =>
      getRulerGroupMaintenanceRecordsWithDatabase(database.db, input),
    getRulerGroup: (rulerGroupId) =>
      getRulerGroupMaintenanceRecordWithDatabase(database.db, rulerGroupId),
    createRulerGroup: (input) =>
      createRulerGroupIdempotentlyWithDatabase(database.db, input),
    replaceRulerGroup: ({ id, expectedVersion, fields }) =>
      replaceRulerGroupWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteRulerGroup: (input) =>
      deleteRulerGroupIfVersionWithDatabase(database.db, input),
    listCurrencies: (input) =>
      getCurrencyMaintenanceRecordsWithDatabase(database.db, input),
    getCurrency: (currencyId) =>
      getCurrencyMaintenanceRecordWithDatabase(database.db, currencyId),
    createCurrency: (input) =>
      createCurrencyIdempotentlyWithDatabase(database.db, input),
    replaceCurrency: ({ id, expectedVersion, fields }) =>
      replaceCurrencyWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteCurrency: (input) =>
      deleteCurrencyIfVersionWithDatabase(database.db, input),
    getCollector: async (collectorRequest) => {
      const resolved = await auth.api.getSession({
        headers: collectorRequest.headers,
      })
      if (resolved === null) return null
      const role = resolved.user.role
      if (role !== "collector" && role !== "editor" && role !== "admin") {
        return null
      }
      return { id: resolved.user.id, role }
    },
    listOrientations: (input) =>
      getOrientationMaintenanceRecordsWithDatabase(database.db, input),
    getOrientation: (orientationId) =>
      getOrientationMaintenanceRecordWithDatabase(database.db, orientationId),
    createOrientation: (input) =>
      createOrientationIdempotentlyWithDatabase(database.db, input),
    replaceOrientation: ({ id, expectedVersion, fields }) =>
      replaceOrientationWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteOrientation: (input) =>
      deleteOrientationIfVersionWithDatabase(database.db, input),
    handleAuthRequest: (authRequest) => auth.handler(authRequest),
    writeLog: (entry) => console.log(JSON.stringify(entry)),
  })
  try {
    return await app.fetch(request)
  } finally {
    await database.client.end()
  }
}
