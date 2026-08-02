import {
  orientationListInputSchema,
  orientationMutationBodySchema,
  orientationOptionsInputSchema,
} from "@coin-archive/api"
import type { Orientation, OrientationListInput } from "@coin-archive/api"
import type { Hono } from "hono"

export type MaintenanceCollector = {
  id: string
  role: "admin" | "collector" | "editor"
}

type OrientationSource = Omit<
  Orientation,
  "createdAt" | "etag" | "updatedAt"
> & {
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

type CreateOrientationResult =
  | { status: "created" | "replayed"; orientation: OrientationSource }
  | { status: "mismatch" }

type ReplaceOrientationResult =
  | { status: "updated"; orientation: OrientationSource }
  | { status: "missing" }
  | { status: "stale" }

type DeleteOrientationResult =
  | { status: "deleted"; orientation: OrientationSource }
  | { status: "missing" }
  | { status: "stale" }

export type OrientationMaintenanceDependencies = {
  listOrientations: (
    input: Required<Pick<OrientationListInput, "limit" | "sort" | "order">> &
      Pick<OrientationListInput, "q"> & { cursor?: OrientationCursor }
  ) => Promise<OrientationListSource[]>
  getOrientation: (id: string) => Promise<OrientationSource | null>
  createOrientation: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    fields: { code: string; name: string }
  }) => Promise<CreateOrientationResult>
  replaceOrientation: (input: {
    id: string
    expectedVersion: number
    fields: { code: string; name: string }
  }) => Promise<ReplaceOrientationResult>
  deleteOrientation: (input: {
    id: string
    expectedVersion: number
  }) => Promise<DeleteOrientationResult>
}

type MaintenanceApiEnvironment = {
  Variables: { collector: MaintenanceCollector; requestId: string }
}

export function registerOrientationMaintenanceRoutes(
  app: Hono<MaintenanceApiEnvironment>,
  dependencies: OrientationMaintenanceDependencies
) {
  app.get("/api/v1/maintenance/orientations", async (context) => {
    const input = parseOrientationCollectionInput(context.req.url, false)
    if (input instanceof Response) return input

    const records = await dependencies.listOrientations({
      q: input.q,
      cursor: input.cursor,
      limit: input.limit + 1,
      sort: input.sort,
      order: input.order,
    })
    return context.json(toOrientationPage(records, input), 200)
  })

  app.post("/api/v1/maintenance/orientations", async (context) => {
    const idempotencyKey = context.req.header("idempotency-key")?.trim()
    if (idempotencyKey === undefined || idempotencyKey.length === 0) {
      return orientationProblemResponse(
        400,
        "idempotency-key-required",
        "idempotency_key_required",
        "Idempotency-Key required",
        "Orientation create requires an Idempotency-Key header",
        context.req.path
      )
    }
    if (idempotencyKey.length > 255) {
      return orientationProblemResponse(
        400,
        "invalid-idempotency-key",
        "invalid_idempotency_key",
        "Invalid Idempotency-Key",
        "Idempotency-Key must contain at most 255 characters",
        context.req.path
      )
    }
    const fields = await parseOrientationMutationBody(context.req.raw)
    if (fields instanceof Response) return fields

    try {
      const result = await dependencies.createOrientation({
        collectorId: context.get("collector").id,
        idempotencyKey,
        requestHash: await digest(JSON.stringify(fields)),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        fields,
      })
      if (result.status === "mismatch") {
        return orientationProblemResponse(
          409,
          "idempotency-key-reuse",
          "idempotency_key_reused",
          "Idempotency-Key already used",
          "This Idempotency-Key was already used with a different payload",
          context.req.path
        )
      }

      const serialized = serializeOrientation(result.orientation)
      return context.json({ data: serialized }, 201, {
        ETag: serialized.etag,
        Location: `/api/v1/maintenance/orientations/${serialized.id}`,
      })
    } catch (error) {
      return mapOrientationPersistenceError(error, "create", context.req.path)
    }
  })

  app.all("/api/v1/maintenance/orientations", (context) =>
    maintenanceProblemResponse(
      405,
      "Method Not Allowed",
      "Only GET and POST are supported",
      context.req.path,
      { Allow: "GET, POST" }
    )
  )

  app.get("/api/v1/maintenance/orientations/options", async (context) => {
    const input = parseOrientationCollectionInput(context.req.url, true)
    if (input instanceof Response) return input

    const records = await dependencies.listOrientations({
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
    if (!isUuid(orientationId)) return invalidOrientationUuid(context.req.path)
    const record = await dependencies.getOrientation(orientationId)
    if (record === null) return orientationNotFound(context.req.path)

    return context.json({ data: serializeOrientation(record) }, 200, {
      ETag: orientationEtag(record),
    })
  })

  app.put("/api/v1/maintenance/orientations/:uuid", async (context) => {
    const orientationId = context.req.param("uuid")
    if (!isUuid(orientationId)) return invalidOrientationUuid(context.req.path)
    const expectedVersion = parseOrientationPrecondition(
      context.req.header("if-match"),
      orientationId,
      context.req.path
    )
    if (expectedVersion instanceof Response) return expectedVersion
    const fields = await parseOrientationMutationBody(context.req.raw)
    if (fields instanceof Response) return fields

    try {
      const result = await dependencies.replaceOrientation({
        id: orientationId,
        expectedVersion,
        fields,
      })
      if (result.status === "missing")
        return orientationNotFound(context.req.path)
      if (result.status === "stale") return staleOrientation(context.req.path)

      const serialized = serializeOrientation(result.orientation)
      return context.json({ data: serialized }, 200, { ETag: serialized.etag })
    } catch (error) {
      return mapOrientationPersistenceError(error, "replace", context.req.path)
    }
  })

  app.delete("/api/v1/maintenance/orientations/:uuid", async (context) => {
    const orientationId = context.req.param("uuid")
    if (!isUuid(orientationId)) return invalidOrientationUuid(context.req.path)
    const expectedVersion = parseOrientationPrecondition(
      context.req.header("if-match"),
      orientationId,
      context.req.path
    )
    if (expectedVersion instanceof Response) return expectedVersion

    try {
      const result = await dependencies.deleteOrientation({
        id: orientationId,
        expectedVersion,
      })
      if (result.status === "missing")
        return orientationNotFound(context.req.path)
      if (result.status === "stale") return staleOrientation(context.req.path)
      return context.body(null, 204)
    } catch (error) {
      return mapOrientationPersistenceError(error, "delete", context.req.path)
    }
  })

  app.all("/api/v1/maintenance/orientations/:uuid", (context) =>
    maintenanceProblemResponse(
      405,
      "Method Not Allowed",
      "Only GET, PUT, and DELETE are supported",
      context.req.path,
      { Allow: "GET, PUT, DELETE" }
    )
  )
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
    etag: orientationEtag(record),
  }
}

async function parseOrientationMutationBody(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return orientationProblemResponse(
      400,
      "invalid-json",
      "invalid_json",
      "Invalid JSON body",
      "The request body must be valid JSON",
      new URL(request.url).pathname
    )
  }
  const parsed = orientationMutationBodySchema.safeParse(body)
  if (parsed.success) return parsed.data

  return orientationProblemResponse(
    422,
    "orientation-validation",
    "orientation_validation_failed",
    "Orientation validation failed",
    "The Orientation could not be saved",
    new URL(request.url).pathname,
    parsed.error.issues.map((issue) => {
      const field = issue.path.at(0) === "code" ? "code" : "name"
      return {
        name: `/${field}`,
        code:
          field === "code"
            ? "invalid_orientation_code"
            : "invalid_orientation_name",
        reason:
          field === "code"
            ? "Orientation Code must use lowercase slug-style text and contain at most 255 characters."
            : "Orientation Name must not be blank and must contain at most 255 characters.",
      }
    })
  )
}

function parseOrientationPrecondition(
  value: string | undefined,
  orientationId: string,
  instance: string
): number | Response {
  if (value === undefined) {
    return orientationProblemResponse(
      400,
      "if-match-required",
      "if_match_required",
      "If-Match required",
      "Orientation replacement and deletion require an If-Match header",
      instance
    )
  }
  try {
    if (!/^"[A-Za-z0-9_-]+"$/.test(value)) throw new Error("invalid")
    const decoded = fromBase64Url(value.slice(1, -1))
    const separator = decoded.lastIndexOf(":")
    const id = decoded.slice(0, separator)
    const version = Number(decoded.slice(separator + 1))
    if (id !== orientationId || !Number.isInteger(version) || version < 1) {
      throw new Error("invalid")
    }
    return version
  } catch {
    return orientationProblemResponse(
      400,
      "invalid-if-match",
      "invalid_if_match",
      "Invalid If-Match",
      "If-Match does not identify this Orientation version",
      instance
    )
  }
}

function invalidOrientationUuid(instance: string) {
  return orientationProblemResponse(
    400,
    "invalid-orientation-uuid",
    "invalid_orientation_uuid",
    "Invalid Orientation UUID",
    "Orientation UUID is invalid",
    instance
  )
}

function orientationNotFound(instance: string) {
  return orientationProblemResponse(
    404,
    "orientation-not-found",
    "orientation_not_found",
    "Orientation not found",
    "No Orientation matches this UUID",
    instance
  )
}

function staleOrientation(instance: string) {
  return orientationProblemResponse(
    412,
    "stale-orientation",
    "orientation_precondition_failed",
    "Orientation changed",
    "The Orientation changed after it was loaded; reload before retrying",
    instance
  )
}

function mapOrientationPersistenceError(
  error: unknown,
  operation: "create" | "delete" | "replace",
  instance: string
) {
  if (
    matchesPostgresConstraint(
      error,
      "23505",
      "orientation_code_lower_unique_idx"
    )
  ) {
    return orientationProblemResponse(
      409,
      "orientation-code-conflict",
      "orientation_code_conflict",
      "Orientation Code already exists",
      "Another Orientation already uses this Orientation Code",
      instance
    )
  }
  if (
    matchesPostgresConstraint(error, "23514", "orientation_code_slug_check")
  ) {
    return orientationProblemResponse(
      422,
      "orientation-validation",
      "orientation_validation_failed",
      "Orientation validation failed",
      "The Orientation could not be saved",
      instance,
      [
        {
          name: "/code",
          code: "invalid_orientation_code",
          reason: "Orientation Code must use lowercase slug-style text.",
        },
      ]
    )
  }
  if (
    operation === "delete" &&
    matchesPostgresConstraint(
      error,
      "23001",
      "coin_orientation_id_orientation_id_fk"
    )
  ) {
    return orientationProblemResponse(
      409,
      "orientation-in-use",
      "orientation_in_use",
      "Orientation is in use",
      "Coins still use this Orientation, so it cannot be deleted",
      instance
    )
  }
  throw error
}

function matchesPostgresConstraint(
  error: unknown,
  code: string,
  constraintName: string
) {
  const candidate =
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null
      ? error.cause
      : error
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    "code" in candidate &&
    candidate.code === code &&
    "constraint_name" in candidate &&
    candidate.constraint_name === constraintName
  )
}

function encodeOrientationCursor(
  value: OrientationCursor & { sort: "code" | "name"; order: "asc" | "desc" }
) {
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

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
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
    String(status),
    maintenanceProblemCode(status),
    title,
    detail,
    instance,
    undefined,
    headers
  )
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

function orientationProblemResponse(
  status: number,
  type: string,
  code: string,
  title: string,
  detail: string,
  instance: string,
  invalidParams?: Array<{ name: string; code: string; reason: string }>,
  headers: Record<string, string> = {}
) {
  const response = problemResponse(
    status,
    type,
    code,
    title,
    detail,
    instance,
    invalidParams,
    headers
  )
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

function maintenanceProblemCode(status: number) {
  return status === 400
    ? "invalid_request"
    : status === 405
      ? "method_not_allowed"
      : "internal_error"
}

function problemResponse(
  status: number,
  type: string,
  code: string,
  title: string,
  detail: string,
  instance: string,
  invalidParams?: Array<{ name: string; code: string; reason: string }>,
  headers: Record<string, string> = {}
) {
  return new Response(
    JSON.stringify({
      type: `https://api.coinarchive.app/problems/${type}`,
      title,
      status,
      detail,
      instance,
      code,
      ...(invalidParams === undefined ? {} : { invalidParams }),
    }),
    {
      status,
      headers: { "Content-Type": "application/problem+json", ...headers },
    }
  )
}
