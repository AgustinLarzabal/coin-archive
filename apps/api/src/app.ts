import { OpenAPIGenerator } from "@orpc/openapi"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import {
  apiContract,
  browseCoinsInputSchema,
  orientationListInputSchema,
  orientationOptionsInputSchema,
} from "@coin-archive/api"
import type {
  BrowseCoinsInput,
  BrowseCoinsOutput,
  CoinDetail,
  CoinDetailOutput,
  Orientation,
  OrientationListInput,
} from "@coin-archive/api"
import { Hono } from "hono"

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

type Collector = {
  id: string
  role: "admin" | "collector" | "editor"
}

type OrientationSource = Omit<Orientation, "createdAt" | "updatedAt"> & {
  createdAt: Date
  updatedAt: Date
}

type OrientationListSource = OrientationSource & {
  cursorValue: string
  cursorSecondaryValue: string
}

type OrientationCursor = {
  value: string
  secondaryValue: string
  id: string
}

type ListOrientations = (
  input: Required<Pick<OrientationListInput, "limit" | "sort" | "order">> &
    Pick<OrientationListInput, "q"> & { cursor?: OrientationCursor }
) => Promise<OrientationListSource[]>

export function createApiApp({
  browseCoins,
  getCoin = async () => null,
  environment,
  surfaceImageOrigin,
  rateLimit = async () => true,
  handleAuthRequest,
  getCollector = async () => null,
  maintenanceRateLimit = async () => true,
  listOrientations = async () => [],
  getOrientation = async () => null,
  trustProxyHeaders = false,
}: {
  browseCoins: BrowseCoins
  getCoin?: GetCoin
  environment: "staging" | "production"
  surfaceImageOrigin: string
  rateLimit?: (clientIp: string) => Promise<boolean>
  handleAuthRequest?: HandleAuthRequest
  getCollector?: (request: Request) => Promise<Collector | null>
  maintenanceRateLimit?: (collectorId: string) => Promise<boolean>
  listOrientations?: ListOrientations
  getOrientation?: (id: string) => Promise<OrientationSource | null>
  trustProxyHeaders?: boolean
}) {
  const app = new Hono()
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

  if (handleAuthRequest !== undefined) {
    app.all("/api/auth/*", async (context) => {
      const requestId = trustProxyHeaders
        ? (context.req.header("x-request-id") ?? crypto.randomUUID())
        : crypto.randomUUID()
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
    if (!(await maintenanceRateLimit(collector.id))) {
      return maintenanceProblemResponse(
        429,
        "Too Many Requests",
        "Maintenance read rate limit exceeded",
        context.req.path,
        { "Retry-After": "60" }
      )
    }

    await next()
    context.header("Cache-Control", "private, no-store")
  })

  app.get("/api/v1/maintenance/orientations", async (context) => {
    const input = parseOrientationCollectionInput(context.req.url, false)
    if (input instanceof Response) return input

    const records = await listOrientations({
      q: input.q,
      cursor: input.cursor,
      limit: input.limit + 1,
      sort: input.sort,
      order: input.order,
    })
    return context.json(toOrientationPage(records, input), 200)
  })

  app.all("/api/v1/maintenance/orientations", (context) =>
    maintenanceProblemResponse(
      405,
      "Method Not Allowed",
      "Only GET is supported",
      context.req.path,
      { Allow: "GET" }
    )
  )

  app.get("/api/v1/maintenance/orientations/options", async (context) => {
    const input = parseOrientationCollectionInput(context.req.url, true)
    if (input instanceof Response) return input

    const records = await listOrientations({
      q: input.q,
      cursor: input.cursor,
      limit: input.limit + 1,
      sort: "name",
      order: "asc",
    })
    const page = toOrientationPage(records, {
      ...input,
      sort: "name",
      order: "asc",
    })

    return context.json(
      {
        data: page.data.map(({ id, code, name }) => ({ id, code, name })),
        nextCursor: page.nextCursor,
      },
      200
    )
  })

  app.all("/api/v1/maintenance/orientations/options", (context) =>
    maintenanceProblemResponse(
      405,
      "Method Not Allowed",
      "Only GET is supported",
      context.req.path,
      { Allow: "GET" }
    )
  )

  app.get("/api/v1/maintenance/orientations/:uuid", async (context) => {
    const orientationId = context.req.param("uuid")
    if (!isUuid(orientationId)) {
      return maintenanceProblemResponse(
        400,
        "Invalid Orientation UUID",
        "Orientation UUID is invalid",
        context.req.path
      )
    }
    const record = await getOrientation(orientationId)
    if (record === null) {
      return maintenanceProblemResponse(
        404,
        "Orientation not found",
        "No Orientation matches this UUID",
        context.req.path
      )
    }

    return context.json({ data: serializeOrientation(record) }, 200, {
      ETag: orientationEtag(record),
    })
  })

  app.all("/api/v1/maintenance/orientations/:uuid", (context) =>
    maintenanceProblemResponse(
      405,
      "Method Not Allowed",
      "Only GET is supported",
      context.req.path,
      { Allow: "GET" }
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
    const document = await new OpenAPIGenerator({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }).generate(apiContract, {
      info: { title: "Coin Archive API", version: "1.0.0" },
    })
    applyOperationSecurity(document)
    return context.json(document, 200, { "Cache-Control": cacheControl })
  })

  return app
}

type ParsedOrientationCollectionInput = {
  q?: string
  cursor?: OrientationCursor
  limit: number
  sort: "code" | "name"
  order: "asc" | "desc"
}

function parseOrientationCollectionInput(
  url: string,
  optionsOnly: boolean
): ParsedOrientationCollectionInput | Response {
  const requestUrl = new URL(url)
  const names: readonly string[] = optionsOnly
    ? ["q", "cursor", "limit"]
    : ["q", "cursor", "limit", "sort", "order"]

  for (const name of requestUrl.searchParams.keys()) {
    if (!names.includes(name)) {
      return invalidMaintenanceQuery(
        `Query parameter '${name}' is unsupported`,
        requestUrl.pathname
      )
    }
  }
  for (const name of names) {
    const values = requestUrl.searchParams.getAll(name)
    if (values.length > 1 || values.some((value) => value.trim() === "")) {
      return invalidMaintenanceQuery(
        `Query parameter '${name}' must appear once and cannot be blank`,
        requestUrl.pathname
      )
    }
  }

  const raw = Object.fromEntries(
    names.flatMap((name) => {
      const value = requestUrl.searchParams.get(name)
      if (value === null) return []
      return [[name, name === "limit" ? Number(value) : value]]
    })
  )
  const parsed = (
    optionsOnly ? orientationOptionsInputSchema : orientationListInputSchema
  ).safeParse(raw)
  if (!parsed.success) {
    return invalidMaintenanceQuery(
      "Query parameters do not match the maintenance API contract",
      requestUrl.pathname
    )
  }

  const sort = optionsOnly
    ? "name"
    : ((raw.sort as "code" | "name" | undefined) ?? "name")
  const order = optionsOnly
    ? "asc"
    : ((raw.order as "asc" | "desc" | undefined) ?? "asc")
  const cursorValue = typeof raw.cursor === "string" ? raw.cursor : undefined
  const cursor =
    cursorValue === undefined
      ? undefined
      : decodeOrientationCursor(cursorValue, sort, order)
  if (cursorValue !== undefined && cursor === undefined) {
    return invalidMaintenanceQuery("Cursor is invalid", requestUrl.pathname)
  }

  return {
    q: typeof raw.q === "string" ? raw.q.trim() : undefined,
    cursor,
    limit: typeof raw.limit === "number" ? raw.limit : 30,
    sort,
    order,
  }
}

function invalidMaintenanceQuery(detail: string, instance: string) {
  return maintenanceProblemResponse(
    400,
    "Invalid query parameters",
    detail,
    instance
  )
}

function toOrientationPage(
  records: OrientationListSource[],
  input: Pick<ParsedOrientationCollectionInput, "limit" | "sort" | "order">
) {
  const pageRecords = records.slice(0, input.limit)
  const data = pageRecords.map(serializeOrientation)
  const last =
    records.length > pageRecords.length ? pageRecords.at(-1) : undefined

  return {
    data,
    nextCursor:
      last === undefined
        ? null
        : encodeOrientationCursor({
            value: last.cursorValue,
            secondaryValue: last.cursorSecondaryValue,
            id: last.id,
            sort: input.sort,
            order: input.order,
          }),
  }
}

function serializeOrientation(record: OrientationSource): Orientation {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function encodeOrientationCursor(value: {
  value: string
  secondaryValue: string
  id: string
  sort: "code" | "name"
  order: "asc" | "desc"
}) {
  return toBase64Url(JSON.stringify(value))
}

function decodeOrientationCursor(
  value: string,
  sort: "code" | "name",
  order: "asc" | "desc"
): OrientationCursor | undefined {
  try {
    const decoded: unknown = JSON.parse(fromBase64Url(value))
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "value" in decoded &&
      "secondaryValue" in decoded &&
      "id" in decoded &&
      "sort" in decoded &&
      "order" in decoded &&
      typeof decoded.value === "string" &&
      typeof decoded.secondaryValue === "string" &&
      typeof decoded.id === "string" &&
      decoded.sort === sort &&
      decoded.order === order &&
      isUuid(decoded.id)
    ) {
      return {
        value: decoded.value,
        secondaryValue: decoded.secondaryValue,
        id: decoded.id,
      }
    }
  } catch {}
  return undefined
}

function orientationEtag(record: Pick<OrientationSource, "id" | "version">) {
  return `"${toBase64Url(`${record.id}:${record.version}`)}"`
}

function toBase64Url(value: string) {
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
}

function maintenanceProblemResponse(
  status: number,
  title: string,
  detail: string,
  instance: string,
  headers: Record<string, string> = {}
) {
  const response = problemResponse(
    status,
    title,
    detail,
    instance,
    undefined,
    headers,
    maintenanceProblemCode(status)
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

function applyOperationSecurity(document: unknown) {
  const mutableDocument = document as {
    components?: { securitySchemes?: Record<string, unknown> }
    paths?: Record<
      string,
      Record<
        string,
        { security?: Array<Record<string, never[]>> } | null | undefined
      >
    >
  }
  mutableDocument.components ??= {}
  mutableDocument.components.securitySchemes ??= {}
  mutableDocument.components.securitySchemes.collectorSession = {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
  }

  for (const [path, pathItem] of Object.entries(mutableDocument.paths ?? {})) {
    for (const operation of Object.values(pathItem)) {
      if (operation === null || operation === undefined) continue
      operation.security = path.startsWith("/api/v1/maintenance/")
        ? [{ collectorSession: [] }]
        : []
    }
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
  code?: string
) {
  return new Response(
    JSON.stringify({
      type: `https://api.coinarchive.app/problems/${status}`,
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
