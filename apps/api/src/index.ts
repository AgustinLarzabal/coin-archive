import {
  createCatalogueIdempotentlyWithDatabase,
  claimSurfaceImageUploadWithDatabase,
  completeCoinMaintenanceCreateWithDatabase,
  releaseCoinCreateResourcesWithDatabase,
  releaseSurfaceImageUploadClaimWithDatabase,
  reserveCoinMaintenanceCreateWithDatabase,
  createCompositionIdempotentlyWithDatabase,
  createCurrencyIdempotentlyWithDatabase,
  createDistributionIdempotentlyWithDatabase,
  createEdgeIdempotentlyWithDatabase,
  createEngraverIdempotentlyWithDatabase,
  createIssuerIdempotentlyWithDatabase,
  createMintIdempotentlyWithDatabase,
  createThemeIdempotentlyWithDatabase,
  createRulerGroupIdempotentlyWithDatabase,
  createRulerIdempotentlyWithDatabase,
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
  deleteMintIfVersionWithDatabase,
  deleteThemeIfVersionWithDatabase,
  deleteRulerGroupIfVersionWithDatabase,
  deleteRulerIfVersionWithDatabase,
  deleteRimIfVersionWithDatabase,
  deleteShapeIfVersionWithDatabase,
  deleteTechniqueIfVersionWithDatabase,
  deleteOrientationIfVersionWithDatabase,
  getCatalogueMaintenanceRecordWithDatabase,
  getDatabaseGeneralSummaryCountsWithDatabase,
  recordSurfaceImageCleanupFailures,
  getCoinMaintenanceDeleteSummaryWithDatabase,
  getCoinMaintenanceApiRecordWithDatabase,
  getCoinMaintenanceRecordsWithDatabase,
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
  getMintMaintenanceRecordWithDatabase,
  getMintMaintenanceRecordsWithDatabase,
  getThemeMaintenanceRecordWithDatabase,
  getThemeMaintenanceRecordsWithDatabase,
  getRulerGroupMaintenanceRecordWithDatabase,
  getRulerGroupMaintenanceRecordsWithDatabase,
  getRulerMaintenanceRecordWithDatabase,
  getRulerMaintenanceRecordsWithDatabase,
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
  replaceMintWithDatabase,
  replaceThemeWithDatabase,
  replaceRulerGroupWithDatabase,
  replaceRulerWithDatabase,
  replaceRimWithDatabase,
  replaceShapeWithDatabase,
  replaceTechniqueWithDatabase,
  replaceOrientationWithDatabase,
  authorizeSurfaceImageUploadIdempotentlyWithDatabase,
} from "@coin-archive/db"
import { createAuth, parseTrustedOrigins } from "@coin-archive/auth/server"
import { WorkerEntrypoint } from "cloudflare:workers"
import { createApiApp } from "./app"
import { createR2SurfaceImageUploadStorage } from "./surface-image-storage"

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
  const surfaceImageStorage = createR2SurfaceImageUploadStorage({
    endpoint: env.R2_ENDPOINT,
    bucket: env.R2_BUCKET,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    publicBaseUrl: env.SURFACE_IMAGE_ORIGIN,
  })
  const app = createApiApp({
    trustProxyHeaders,
    environment: env.API_ENVIRONMENT,
    surfaceImageOrigin: env.SURFACE_IMAGE_ORIGIN,
    authorizeSurfaceImageUpload: (input) =>
      authorizeSurfaceImageUploadIdempotentlyWithDatabase(
        database.db,
        input,
        () => surfaceImageStorage.authorizeUpload(input.upload)
      ),
    cancelSurfaceImageUpload: ({ reference, surface }) =>
      surfaceImageStorage.cancelUpload(reference, surface),
    prepareSurfaceImageUpload: (reference, surface) =>
      surfaceImageStorage.prepareUpload(reference, surface),
    finalizeSurfaceImageUpload: (reference, surface) =>
      surfaceImageStorage.finalizeUpload(reference, surface),
    deletePublishedSurfaceImage: (imageUrl) =>
      surfaceImageStorage.deletePublishedImage(imageUrl),
    recordSurfaceImageCleanupFailures: ({ cleanupSubjectId, failures }) =>
      recordSurfaceImageCleanupFailures({
        deletedCoinId: cleanupSubjectId,
        failures,
      }),
    reserveMaintenanceCoinCreate: (input) =>
      reserveCoinMaintenanceCreateWithDatabase(database.db, input),
    completeMaintenanceCoinCreate: (input) =>
      completeCoinMaintenanceCreateWithDatabase(database.db, input),
    releaseCoinCreateResources: (input) =>
      releaseCoinCreateResourcesWithDatabase(database.db, input),
    claimSurfaceImageUpload: (input) =>
      claimSurfaceImageUploadWithDatabase(database.db, input),
    releaseSurfaceImageUploadClaim: (input) =>
      releaseSurfaceImageUploadClaimWithDatabase(database.db, input),
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
    getDatabaseMaintenanceOverview: () =>
      getDatabaseGeneralSummaryCountsWithDatabase(database.db),
    listMaintenanceCoins: (input) =>
      getCoinMaintenanceRecordsWithDatabase(database.db, input),
    getMaintenanceCoin: (coinId) =>
      getCoinMaintenanceApiRecordWithDatabase(database.db, coinId),
    getMaintenanceCoinDeleteSummary: (coinId) =>
      getCoinMaintenanceDeleteSummaryWithDatabase(database.db, coinId),
    getCoinMaintenanceOptions: async () => {
      const all = <T extends MaintenanceCursorRecord>(
        list: MaintenanceCursorList<T>
      ) => collectAllMaintenanceRecords(list)
      const [
        catalogues,
        compositions,
        currencies,
        distributions,
        edges,
        engravers,
        issuers,
        mints,
        orientations,
        rims,
        rulers,
        shapes,
        mintingTechniques,
        themes,
      ] = await Promise.all([
        all((input) =>
          getCatalogueMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getCompositionMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getCurrencyMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getDistributionMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getEdgeMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getEngraverMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getIssuerMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getMintMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getOrientationMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getRimMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getRulerMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getShapeMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getTechniqueMaintenanceRecordsWithDatabase(database.db, input)
        ),
        all((input) =>
          getThemeMaintenanceRecordsWithDatabase(database.db, input)
        ),
      ])
      return {
        catalogues: catalogues.map(({ id, code, title }) => ({
          id,
          code,
          title,
        })),
        compositions: compositions.map(({ id, code, name }) => ({
          id,
          code,
          name,
        })),
        currencies: currencies.map(({ id, code, name, fullName }) => ({
          id,
          code,
          name,
          fullName,
        })),
        distributions: distributions.map(({ id, code, name }) => ({
          id,
          code,
          name,
        })),
        edges: edges.map(({ id, code, name }) => ({ id, code, name })),
        engravers: engravers.map(({ id, code, name }) => ({ id, code, name })),
        issuers: issuers.map(({ id, code, isoCode, name }) => ({
          id,
          code,
          isoCode,
          name,
        })),
        mints: mints.map(({ id, code, name }) => ({ id, code, name })),
        orientations: orientations.map(({ id, code, name }) => ({
          id,
          code,
          name,
        })),
        rims: rims.map(({ id, code, name }) => ({ id, code, name })),
        rulers: rulers.map(({ id, code, name, group }) => ({
          id,
          code,
          name,
          group,
        })),
        shapes: shapes.map(({ id, code, name }) => ({ id, code, name })),
        mintingTechniques: mintingTechniques.map(({ id, code, name }) => ({
          id,
          code,
          name,
        })),
        themes: themes.map(({ id, code, name }) => ({ id, code, name })),
      }
    },
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
    listMints: (input) =>
      getMintMaintenanceRecordsWithDatabase(database.db, input),
    getMint: (mintId) =>
      getMintMaintenanceRecordWithDatabase(database.db, mintId),
    createMint: (input) =>
      createMintIdempotentlyWithDatabase(database.db, input),
    replaceMint: ({ id, expectedVersion, fields }) =>
      replaceMintWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteMint: (input) => deleteMintIfVersionWithDatabase(database.db, input),
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
    listRulers: (input) =>
      getRulerMaintenanceRecordsWithDatabase(database.db, input),
    getRuler: (rulerId) =>
      getRulerMaintenanceRecordWithDatabase(database.db, rulerId),
    createRuler: (input) =>
      createRulerIdempotentlyWithDatabase(database.db, input),
    replaceRuler: ({ id, expectedVersion, fields }) =>
      replaceRulerWithDatabase(database.db, {
        id,
        expectedVersion,
        ...fields,
      }),
    deleteRuler: (input) =>
      deleteRulerIfVersionWithDatabase(database.db, input),
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

type MaintenanceCursor = {
  value: string
  secondaryValue: string
  id: string
}
type MaintenanceCursorRecord = {
  id: string
  cursorValue: string
  cursorSecondaryValue: string
}
type MaintenanceCursorList<T extends MaintenanceCursorRecord> = (input: {
  cursor?: MaintenanceCursor
  limit: number
}) => Promise<T[]>

async function collectAllMaintenanceRecords<T extends MaintenanceCursorRecord>(
  list: MaintenanceCursorList<T>
) {
  const records: T[] = []
  const pageSize = 100
  let cursor: MaintenanceCursor | undefined
  do {
    const page = await list({
      ...(cursor === undefined ? {} : { cursor }),
      limit: pageSize,
    })
    records.push(...page)
    const last = page.at(-1)
    cursor =
      page.length === pageSize && last !== undefined
        ? {
            value: last.cursorValue,
            secondaryValue: last.cursorSecondaryValue,
            id: last.id,
          }
        : undefined
  } while (cursor !== undefined)
  return records
}
