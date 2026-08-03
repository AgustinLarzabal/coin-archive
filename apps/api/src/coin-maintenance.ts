import {
  coinMaintenanceCreateInputSchema,
  coinMaintenanceListInputSchema,
  coinMaintenanceReplaceBodySchema,
} from "@coin-archive/api"
import type {
  CoinMaintenanceCreateBody,
  CoinMaintenanceDeleteSummary,
  CoinMaintenanceDetail,
  CoinMaintenanceListInput,
  CoinMaintenanceListItem,
  CoinMaintenanceOptionsOutput,
  CoinMaintenanceReplaceBody,
} from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"
import { SurfaceImageUploadReferenceError } from "./surface-image-storage"

type Cursor = { value: string; secondaryValue: string; id: string }
type ListSource = Omit<CoinMaintenanceListItem, "createdAt" | "updatedAt"> & {
  createdAt: Date
  updatedAt: Date
  cursorValue: string
  cursorSecondaryValue: string
}
type DetailSource = Omit<
  CoinMaintenanceDetail,
  | "createdAt"
  | "updatedAt"
  | "etag"
  | "diameter"
  | "faceValueNumericValue"
  | "mintage"
  | "thickness"
  | "weight"
> & {
  createdAt: Date
  updatedAt: Date
  diameter: number | string | null
  faceValueNumericValue: number | string
  mintage: number | string | null
  thickness: number | string | null
  weight: number | string | null
}

export type CoinMaintenanceDependencies = {
  listMaintenanceCoins: (input: {
    q?: string
    issuerCode?: string
    rulerCode?: string
    distributionCode?: string
    currencyCode?: string
    compositionCode?: string
    cursor?: Cursor
    limit: number
    sort: "updatedAt" | "title"
    order: "asc" | "desc"
  }) => Promise<ListSource[]>
  getMaintenanceCoin: (id: string) => Promise<DetailSource | null>
  getMaintenanceCoinDeleteSummary: (
    id: string
  ) => Promise<CoinMaintenanceDeleteSummary | null>
  getCoinMaintenanceOptions: () => Promise<CoinMaintenanceOptionsOutput["data"]>
  reserveMaintenanceCoinCreate: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
  }) => Promise<
    | { status: "reserved" | "in_progress" | "mismatch" }
    | { status: "replayed"; coin: { id: string } }
  >
  completeMaintenanceCoinCreate: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    fields: CoinCreatePersistenceFields
  }) => Promise<{ status: "created"; coin: { id: string } }>
  replaceMaintenanceCoin: (input: {
    id: string
    expectedVersion: number
    fields: CoinCreatePersistenceFields
  }) => Promise<
    | { status: "updated"; coin: { id: string; version: number } }
    | { status: "missing" | "stale" }
  >
  releaseCoinCreateResources: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    uploadClaims: ClaimedImage[]
  }) => Promise<boolean>
  claimSurfaceImageUpload: (input: {
    claimToken: string
    referenceHash: string
    expiresAt: Date
  }) => Promise<boolean>
  releaseSurfaceImageUploadClaim: (input: {
    claimToken: string
    referenceHash: string
  }) => Promise<void>
  prepareSurfaceImageUpload: (
    reference: string,
    surface: "obverse" | "reverse" | "edge"
  ) => Promise<{ imageUrl: string }>
  finalizeSurfaceImageUpload: (
    reference: string,
    surface: "obverse" | "reverse" | "edge"
  ) => Promise<void>
  deletePublishedSurfaceImage: (imageUrl: string) => Promise<void>
  recordSurfaceImageCleanupFailures: (input: {
    cleanupSubjectId: string
    failures: Array<{ errorMessage: string; imageUrl: string }>
  }) => Promise<void>
}

type CoinCreatePersistenceFields = Omit<
  CoinMaintenanceCreateBody,
  | "diameter"
  | "faceValueNumericValue"
  | "mintage"
  | "surfaces"
  | "thickness"
  | "weight"
> & {
  diameter: number | null
  faceValueNumericValue: number
  mintage: number | null
  thickness: number | null
  weight: number | null
  surfaces: {
    obverse: CoinCreateFaceSurface | null
    reverse: CoinCreateFaceSurface | null
    edge: CoinCreateSurface | null
  }
}
type CoinCreateSurface = {
  description: string | null
  lettering: string | null
  imageUrl: string | null
}
type CoinCreateFaceSurface = CoinCreateSurface & { engraverIds: string[] }

type Env = { Variables: { collector: MaintenanceCollector; requestId: string } }

export function registerCoinMaintenanceRoutes(
  app: Hono<Env>,
  dependencies: CoinMaintenanceDependencies
) {
  app.get("/api/v1/maintenance/coins", async (context) => {
    const input = parseCollection(context.req.url)
    if (input instanceof Response) return input
    const records = await dependencies.listMaintenanceCoins({
      q: input.q,
      issuerCode: input.issuer,
      rulerCode: input.ruler,
      distributionCode: input.distribution,
      currencyCode: input.currency,
      compositionCode: input.composition,
      ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
      limit: input.limit + 1,
      sort: input.sort,
      order: input.order,
    })
    const selected = records.slice(0, input.limit)
    const last = records.length > selected.length ? selected.at(-1) : undefined
    return context.json({
      data: selected.map(serializeListItem),
      nextCursor:
        last === undefined
          ? null
          : encodeCursor({
              value: last.cursorValue,
              secondaryValue: last.cursorSecondaryValue,
              id: last.id,
              sort: input.sort,
              order: input.order,
            }),
    })
  })

  app.post("/api/v1/maintenance/coins", async (context) => {
    const idempotencyKey = context.req.header("idempotency-key")?.trim()
    if (!idempotencyKey) {
      return problem(
        400,
        "Idempotency-Key required",
        "Coin create requires an Idempotency-Key header",
        context.req.path,
        "idempotency_key_required"
      )
    }
    const parsedHeaders =
      coinMaintenanceCreateInputSchema.shape.headers.safeParse({
        "idempotency-key": idempotencyKey,
      })
    if (!parsedHeaders.success) {
      return problem(
        400,
        "Invalid Idempotency-Key",
        "Idempotency-Key must contain at most 255 characters",
        context.req.path,
        "invalid_idempotency_key"
      )
    }
    const json = await readJson(context.req.raw)
    if (json instanceof Response) return json
    const parsedBody =
      coinMaintenanceCreateInputSchema.shape.body.safeParse(json)
    if (!parsedBody.success) {
      return validationProblem(context.req.path, parsedBody.error.issues)
    }

    const preparedImages: PreparedImage[] = []
    const claimedImages: ClaimedImage[] = []
    let aggregatePersisted = false
    let coinCreateReserved = false
    let request: CoinCreateRequest | undefined
    try {
      request = {
        collectorId: context.get("collector").id,
        idempotencyKey: parsedHeaders.data["idempotency-key"],
        requestHash: await digest(JSON.stringify(parsedBody.data)),
      }
      const previous = await dependencies.reserveMaintenanceCoinCreate({
        ...request,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      if (previous.status === "mismatch") {
        return problem(
          409,
          "Idempotency-Key already used",
          "This Idempotency-Key was already used with a different payload",
          context.req.path,
          "idempotency_key_reused"
        )
      }
      if (previous.status === "in_progress") {
        return problem(
          409,
          "Idempotent request in progress",
          "A request with this Idempotency-Key is already in progress",
          context.req.path,
          "idempotency_request_in_progress"
        )
      }
      coinCreateReserved = previous.status === "reserved"
      const result =
        previous.status === "replayed"
          ? previous
          : await dependencies.completeMaintenanceCoinCreate({
              ...request,
              fields: await toPersistenceFields(
                parsedBody.data,
                dependencies,
                claimedImages,
                preparedImages
              ),
            })
      aggregatePersisted = true
      const finalization = await Promise.allSettled(
        preparedImages.map(({ reference, surface }) =>
          dependencies.finalizeSurfaceImageUpload(reference, surface)
        )
      )
      const finalizationFailures = finalization.flatMap(
        (finalizationResult, index) =>
          finalizationResult.status === "rejected"
            ? [
                {
                  imageUrl: `temporary-upload-reference:${preparedImages[index].reference}`,
                  errorMessage: `Temporary upload finalization failed: ${cleanupErrorMessage(finalizationResult.reason)}`,
                },
              ]
            : []
      )
      if (finalizationFailures.length > 0) {
        await dependencies.recordSurfaceImageCleanupFailures({
          cleanupSubjectId: result.coin.id,
          failures: finalizationFailures,
        })
      }
      const record = await dependencies.getMaintenanceCoin(result.coin.id)
      if (record === null) throw new Error("Created Coin could not be read")
      const data = serializeDetail(record)
      return context.json({ data }, 201, {
        ETag: data.etag,
        Location: `/api/v1/maintenance/coins/${data.id}`,
      })
    } catch (error) {
      if (!aggregatePersisted) {
        let resourcesReleased = true
        if (coinCreateReserved && request !== undefined) {
          resourcesReleased = await dependencies.releaseCoinCreateResources({
            ...request,
            uploadClaims: claimedImages,
          })
        } else {
          await Promise.all(
            claimedImages.map(({ claimToken, referenceHash }) =>
              dependencies.releaseSurfaceImageUploadClaim({
                claimToken,
                referenceHash,
              })
            )
          )
        }
        if (resourcesReleased) {
          const cleanup = await Promise.allSettled(
            preparedImages.map(({ imageUrl }) =>
              dependencies.deletePublishedSurfaceImage(imageUrl)
            )
          )
          const failures = cleanup.flatMap((result, index) =>
            result.status === "rejected"
              ? [
                  {
                    imageUrl: preparedImages[index].imageUrl,
                    errorMessage: cleanupErrorMessage(result.reason),
                  },
                ]
              : []
          )
          if (failures.length > 0) {
            await dependencies.recordSurfaceImageCleanupFailures({
              cleanupSubjectId: crypto.randomUUID(),
              failures,
            })
          }
        }
      }
      if (error instanceof CoinSurfaceImageError) {
        return problem(
          422,
          "Invalid Surface Image upload",
          "A temporary Surface Image reference could not be verified",
          context.req.path,
          "surface_image_upload_invalid"
        )
      }
      if (postgresCode(error) === "23503") {
        return problem(
          409,
          "Coin relationship not found",
          "A referenced maintenance record does not exist",
          context.req.path,
          "coin_relationship_not_found"
        )
      }
      throw error
    }
  })

  app.all("/api/v1/maintenance/coins", (context) =>
    methodNotAllowed(context.req.path, "GET, POST")
  )

  app.get("/api/v1/maintenance/coins/options", async (context) =>
    context.json({ data: await dependencies.getCoinMaintenanceOptions() })
  )

  app.all("/api/v1/maintenance/coins/options", (context) =>
    methodNotAllowed(context.req.path)
  )

  app.get(
    "/api/v1/maintenance/coins/:uuid/deletion-summary",
    async (context) => {
      const id = context.req.param("uuid")
      if (!isUuid(id)) return invalidUuid(context.req.path)
      const summary = await dependencies.getMaintenanceCoinDeleteSummary(id)
      return summary === null
        ? coinNotFound(context.req.path)
        : context.json({ data: summary })
    }
  )

  app.all("/api/v1/maintenance/coins/:uuid/deletion-summary", (context) =>
    methodNotAllowed(context.req.path)
  )

  app.get("/api/v1/maintenance/coins/:uuid", async (context) => {
    const id = context.req.param("uuid")
    if (!isUuid(id)) return invalidUuid(context.req.path)
    const record = await dependencies.getMaintenanceCoin(id)
    if (record === null) return coinNotFound(context.req.path)
    const data = serializeDetail(record)
    return context.json({ data }, 200, { ETag: data.etag })
  })

  app.put("/api/v1/maintenance/coins/:uuid", async (context) => {
    const id = context.req.param("uuid")
    if (!isUuid(id)) return invalidUuid(context.req.path)
    const expectedVersion = parseCoinPrecondition(
      context.req.header("if-match"),
      id,
      context.req.path
    )
    if (expectedVersion instanceof Response) return expectedVersion
    const json = await readJson(context.req.raw)
    if (json instanceof Response) return json
    const parsedBody = coinMaintenanceReplaceBodySchema.safeParse(json)
    if (!parsedBody.success) {
      return validationProblem(context.req.path, parsedBody.error.issues)
    }
    const previous = await dependencies.getMaintenanceCoin(id)
    if (previous === null) return coinNotFound(context.req.path)

    const preparedImages: PreparedImage[] = []
    const claimedImages: ClaimedImage[] = []
    let aggregatePersisted = false
    try {
      const fields = await toPersistenceFields(
        parsedBody.data,
        dependencies,
        claimedImages,
        preparedImages,
        previous
      )
      const result = await dependencies.replaceMaintenanceCoin({
        id,
        expectedVersion,
        fields,
      })
      if (result.status !== "updated") {
        const failures = await releaseReplacementImages(
          dependencies,
          claimedImages,
          preparedImages
        )
        await recordImageFailures(dependencies, id, failures)
        return result.status === "missing"
          ? coinNotFound(context.req.path)
          : staleCoin(context.req.path)
      }
      aggregatePersisted = true

      const finalizationFailures = await finalizePreparedImages(
        dependencies,
        preparedImages
      )
      const replacedImageFailures = await removeReplacedImages(
        dependencies,
        previous,
        fields
      )
      const failures = [...finalizationFailures, ...replacedImageFailures]
      if (failures.length > 0) {
        await dependencies.recordSurfaceImageCleanupFailures({
          cleanupSubjectId: id,
          failures,
        })
      }

      const record = await dependencies.getMaintenanceCoin(id)
      if (record === null) throw new Error("Replaced Coin could not be read")
      const data = serializeDetail(record)
      return context.json({ data }, 200, { ETag: data.etag })
    } catch (error) {
      if (!aggregatePersisted) {
        const failures = await releaseReplacementImages(
          dependencies,
          claimedImages,
          preparedImages
        )
        await recordImageFailures(dependencies, id, failures)
      }
      if (error instanceof CoinSurfaceImageError) {
        return problem(
          422,
          "Invalid Surface Image upload",
          "A temporary Surface Image reference could not be verified",
          context.req.path,
          "surface_image_upload_invalid"
        )
      }
      if (postgresCode(error) === "23503") {
        return problem(
          409,
          "Coin relationship not found",
          "A referenced maintenance record does not exist",
          context.req.path,
          "coin_relationship_not_found"
        )
      }
      throw error
    }
  })

  app.all("/api/v1/maintenance/coins/:uuid", (context) =>
    methodNotAllowed(context.req.path, "GET, PUT")
  )
}

class CoinSurfaceImageError extends Error {}

type CoinCreateRequest = {
  collectorId: string
  idempotencyKey: string
  requestHash: string
}
type ClaimedImage = { claimToken: string; referenceHash: string }

type PreparedImage = {
  imageUrl: string
  reference: string
  surface: "obverse" | "reverse" | "edge"
}

async function toPersistenceFields(
  body: CoinMaintenanceCreateBody | CoinMaintenanceReplaceBody,
  dependencies: CoinMaintenanceDependencies,
  claimedImages: ClaimedImage[],
  preparedImages: PreparedImage[],
  existing?: DetailSource
): Promise<CoinCreatePersistenceFields> {
  const consumeImage = async (
    reference: string | null,
    surface: "obverse" | "reverse" | "edge",
    requestedImageUrl: string | null = null
  ) => {
    if (reference === null) {
      const existingImageUrl = existing?.surfaces[surface]?.imageUrl ?? null
      if (
        requestedImageUrl !== null &&
        requestedImageUrl !== existingImageUrl
      ) {
        throw new CoinSurfaceImageError(
          "Surface Image URL does not match the current Coin"
        )
      }
      return requestedImageUrl
    }
    try {
      const claim = {
        claimToken: crypto.randomUUID(),
        referenceHash: await digest(reference),
      }
      if (
        !(await dependencies.claimSurfaceImageUpload({
          ...claim,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }))
      ) {
        throw new CoinSurfaceImageError("Surface Image upload was consumed")
      }
      claimedImages.push(claim)
      const result = await dependencies.prepareSurfaceImageUpload(
        reference,
        surface
      )
      preparedImages.push({ ...result, reference, surface })
      return result.imageUrl
    } catch (error) {
      if (!(error instanceof SurfaceImageUploadReferenceError)) throw error
      throw new CoinSurfaceImageError("Surface Image upload is invalid", {
        cause: error,
      })
    }
  }
  const face = async (
    surface:
      | CoinMaintenanceCreateBody["surfaces"]["obverse"]
      | CoinMaintenanceReplaceBody["surfaces"]["obverse"],
    kind: "obverse" | "reverse"
  ): Promise<CoinCreateFaceSurface | null> =>
    surface === null
      ? null
      : {
          description: surface.description,
          lettering: surface.lettering,
          imageUrl: await consumeImage(
            surface.imageUploadReference,
            kind,
            "imageUrl" in surface && typeof surface.imageUrl === "string"
              ? surface.imageUrl
              : null
          ),
          engraverIds: surface.engraverIds,
        }
  const edge = body.surfaces.edge
  return {
    ...body,
    diameter: numberOrNull(body.diameter),
    faceValueNumericValue: Number(body.faceValueNumericValue),
    mintage: numberOrNull(body.mintage),
    thickness: numberOrNull(body.thickness),
    weight: numberOrNull(body.weight),
    surfaces: {
      obverse: await face(body.surfaces.obverse, "obverse"),
      reverse: await face(body.surfaces.reverse, "reverse"),
      edge:
        edge === null
          ? null
          : {
              description: edge.description,
              lettering: edge.lettering,
              imageUrl: await consumeImage(
                edge.imageUploadReference,
                "edge",
                "imageUrl" in edge && typeof edge.imageUrl === "string"
                  ? edge.imageUrl
                  : null
              ),
            },
    },
  }
}

async function releaseReplacementImages(
  dependencies: CoinMaintenanceDependencies,
  claimedImages: ClaimedImage[],
  preparedImages: PreparedImage[]
) {
  await Promise.all(
    claimedImages.map((claim) =>
      dependencies.releaseSurfaceImageUploadClaim(claim)
    )
  )
  const cleanup = await Promise.allSettled(
    preparedImages.map(({ imageUrl }) =>
      dependencies.deletePublishedSurfaceImage(imageUrl)
    )
  )
  return cleanup.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            imageUrl: preparedImages[index].imageUrl,
            errorMessage: cleanupErrorMessage(result.reason),
          },
        ]
      : []
  )
}

async function recordImageFailures(
  dependencies: CoinMaintenanceDependencies,
  cleanupSubjectId: string,
  failures: Array<{ imageUrl: string; errorMessage: string }>
) {
  if (failures.length === 0) return
  await dependencies.recordSurfaceImageCleanupFailures({
    cleanupSubjectId,
    failures,
  })
}

async function finalizePreparedImages(
  dependencies: CoinMaintenanceDependencies,
  preparedImages: PreparedImage[]
) {
  const finalization = await Promise.allSettled(
    preparedImages.map(({ reference, surface }) =>
      dependencies.finalizeSurfaceImageUpload(reference, surface)
    )
  )
  return finalization.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            imageUrl: `temporary-upload-reference:${preparedImages[index].reference}`,
            errorMessage: `Temporary upload finalization failed: ${cleanupErrorMessage(result.reason)}`,
          },
        ]
      : []
  )
}

async function removeReplacedImages(
  dependencies: CoinMaintenanceDependencies,
  previous: DetailSource,
  fields: CoinCreatePersistenceFields
) {
  const obsoleteUrls = (["obverse", "reverse", "edge"] as const).flatMap(
    (surface) => {
      const previousUrl = previous.surfaces[surface]?.imageUrl ?? null
      const nextUrl = fields.surfaces[surface]?.imageUrl ?? null
      return previousUrl !== null && previousUrl !== nextUrl
        ? [previousUrl]
        : []
    }
  )
  const cleanup = await Promise.allSettled(
    obsoleteUrls.map((imageUrl) =>
      dependencies.deletePublishedSurfaceImage(imageUrl)
    )
  )
  return cleanup.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            imageUrl: obsoleteUrls[index],
            errorMessage: cleanupErrorMessage(result.reason),
          },
        ]
      : []
  )
}

function cleanupErrorMessage(error: unknown) {
  return (
    error instanceof Error ? error.message : "Unknown cleanup error"
  ).slice(0, 2000)
}

function numberOrNull(value: string | null) {
  return value === null ? null : Number(value)
}

async function readJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json()
  } catch {
    return problem(
      400,
      "Invalid JSON",
      "The Coin request body must be valid JSON",
      new URL(request.url).pathname,
      "invalid_json"
    )
  }
}

function validationProblem(
  instance: string,
  issues: Array<{ path: PropertyKey[]; message: string }>
) {
  return new Response(
    JSON.stringify({
      type: "https://api.coinarchive.app/problems/coin-validation-failed",
      title: "Invalid Coin",
      status: 422,
      detail: "The Coin aggregate does not match the maintenance contract",
      instance,
      code: "coin_validation_failed",
      invalidParams: issues.map((issue) => ({
        name: `/${issue.path.map(String).join("/")}`,
        code: "coin_field_invalid",
        reason: issue.message,
      })),
    }),
    {
      status: 422,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "private, no-store",
      },
    }
  )
}

function postgresCode(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined
  const record = error as { code?: unknown; cause?: unknown }
  if (typeof record.code === "string") return record.code
  return postgresCode(record.cause)
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

type CollectionInput = Omit<CoinMaintenanceListInput, "cursor" | "limit"> & {
  cursor?: Cursor
  limit: number
  sort: "updatedAt" | "title"
  order: "asc" | "desc"
}

function parseCollection(url: string): CollectionInput | Response {
  const requestUrl = new URL(url)
  const names = [
    "q",
    "issuer",
    "ruler",
    "distribution",
    "currency",
    "composition",
    "cursor",
    "limit",
    "sort",
    "order",
  ]
  for (const key of requestUrl.searchParams.keys()) {
    if (!names.includes(key)) return invalidQuery(requestUrl.pathname)
  }
  const raw: Record<string, unknown> = {}
  for (const name of names) {
    const values = requestUrl.searchParams.getAll(name)
    if (values.length > 1 || values.some((value) => !value.trim())) {
      return invalidQuery(requestUrl.pathname)
    }
    const value = requestUrl.searchParams.get(name)
    if (value !== null) raw[name] = name === "limit" ? Number(value) : value
  }
  const parsed = coinMaintenanceListInputSchema.safeParse(raw)
  if (!parsed.success) return invalidQuery(requestUrl.pathname)
  const sort = parsed.data.sort ?? "updatedAt"
  const order = parsed.data.order ?? (sort === "updatedAt" ? "desc" : "asc")
  const cursor =
    parsed.data.cursor === undefined
      ? undefined
      : decodeCursor(parsed.data.cursor, sort, order)
  if (parsed.data.cursor !== undefined && cursor === undefined) {
    return invalidQuery(requestUrl.pathname)
  }
  return { ...parsed.data, cursor, limit: parsed.data.limit ?? 50, sort, order }
}

function serializeListItem(record: ListSource): CoinMaintenanceListItem {
  const {
    cursorValue: _value,
    cursorSecondaryValue: _secondary,
    ...item
  } = record
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

function serializeDetail(record: DetailSource): CoinMaintenanceDetail {
  return {
    ...record,
    diameter: decimal(record.diameter),
    faceValueNumericValue: String(record.faceValueNumericValue),
    mintage: decimal(record.mintage),
    thickness: decimal(record.thickness),
    weight: decimal(record.weight),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    etag: etag(record),
  }
}

function decimal(value: number | string | null): string | null {
  return value === null ? null : String(value)
}

function etag(record: Pick<DetailSource, "id" | "version">) {
  return `"${encodeBase64Url(`${record.id}:${record.version}`)}"`
}

function encodeCursor(value: Cursor & { sort: string; order: string }) {
  return encodeBase64Url(JSON.stringify(value))
}

function decodeCursor(value: string, sort: string, order: string) {
  try {
    const data: unknown = JSON.parse(decodeBase64Url(value))
    if (
      typeof data === "object" &&
      data !== null &&
      "value" in data &&
      typeof data.value === "string" &&
      "secondaryValue" in data &&
      typeof data.secondaryValue === "string" &&
      "id" in data &&
      typeof data.id === "string" &&
      isUuid(data.id) &&
      "sort" in data &&
      data.sort === sort &&
      "order" in data &&
      data.order === order
    )
      return {
        value: data.value,
        secondaryValue: data.secondaryValue,
        id: data.id,
      }
  } catch {}
  return undefined
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

function decodeBase64Url(value: string) {
  const binary = atob(
    value
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=")
  )
  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0))
  )
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string,
  code: string
) {
  return new Response(
    JSON.stringify({
      type: `https://api.coinarchive.app/problems/${code.replaceAll("_", "-")}`,
      title,
      status,
      detail,
      instance,
      code,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "private, no-store",
      },
    }
  )
}

function invalidQuery(instance: string) {
  return problem(
    400,
    "Invalid Coin Maintenance query",
    "The collection query is invalid",
    instance,
    "invalid_query"
  )
}
function invalidUuid(instance: string) {
  return problem(
    400,
    "Invalid Coin UUID",
    "Coin UUID is invalid",
    instance,
    "invalid_coin_uuid"
  )
}
function parseCoinPrecondition(
  value: string | undefined,
  coinId: string,
  instance: string
): number | Response {
  if (value === undefined) {
    return problem(
      400,
      "If-Match required",
      "Coin replacement requires an If-Match header",
      instance,
      "if_match_required"
    )
  }
  try {
    if (!/^"[A-Za-z0-9_-]+"$/.test(value)) throw new Error("invalid")
    const decoded = decodeBase64Url(value.slice(1, -1))
    const separator = decoded.lastIndexOf(":")
    const id = decoded.slice(0, separator)
    const version = Number(decoded.slice(separator + 1))
    if (id !== coinId || !Number.isInteger(version) || version < 1) {
      throw new Error("invalid")
    }
    return version
  } catch {
    return problem(
      400,
      "Invalid If-Match",
      "If-Match does not identify this Coin version",
      instance,
      "invalid_if_match"
    )
  }
}
function staleCoin(instance: string) {
  return problem(
    412,
    "Coin changed",
    "The Coin changed after it was loaded; reload and reconcile before retrying",
    instance,
    "coin_precondition_failed"
  )
}
function coinNotFound(instance: string) {
  return problem(
    404,
    "Coin not found",
    "No Coin matches this UUID",
    instance,
    "coin_not_found"
  )
}
function methodNotAllowed(instance: string, allow = "GET") {
  const response = problem(
    405,
    "Method Not Allowed",
    `Only ${allow} is supported`,
    instance,
    "method_not_allowed"
  )
  response.headers.set("Allow", allow)
  return response
}
