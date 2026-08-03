import {
  shapeCreateInputSchema,
  shapeDeleteInputSchema,
  shapeDetailInputSchema,
  shapeListInputSchema,
  shapeMutationBodySchema,
  shapeOptionsInputSchema,
  shapeReplaceInputSchema,
} from "@coin-archive/api"
import type { Shape, ShapeListInput } from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"

type ShapeSourceRecord = Omit<Shape, "createdAt" | "updatedAt" | "etag"> & {
  createdAt: Date
  updatedAt: Date
}
type Cursor = { value: string; secondaryValue: string; id: string }
export type ShapeMaintenanceDependencies = {
  listShapes: (
    input: Required<Pick<ShapeListInput, "limit" | "sort" | "order">> & {
      q?: string
      cursor?: Cursor
    }
  ) => Promise<
    (ShapeSourceRecord & { cursorValue: string; cursorSecondaryValue: string })[]
  >
  getShape: (id: string) => Promise<ShapeSourceRecord | null>
  createShape: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    fields: { code: string; name: string }
  }) => Promise<
    | { status: "created" | "replayed"; shape: ShapeSourceRecord }
    | { status: "mismatch" }
  >
  replaceShape: (input: {
    id: string
    expectedVersion: number
    fields: { code: string; name: string }
  }) => Promise<
    | { status: "updated"; shape: ShapeSourceRecord }
    | { status: "missing" | "stale" }
  >
  deleteShape: (input: {
    id: string
    expectedVersion: number
  }) => Promise<
    | { status: "deleted"; shape: ShapeSourceRecord }
    | { status: "missing" | "stale" }
  >
}
type Env = { Variables: { collector: MaintenanceCollector; requestId: string } }

export function registerShapeMaintenanceRoutes(
  app: Hono<Env>,
  dependencies: ShapeMaintenanceDependencies
) {
  app.get("/api/v1/maintenance/shapes", async (c) => {
    const input = parseCollection(c.req.url, false)
    if (input instanceof Response) return input
    const records = await dependencies.listShapes({
      ...input,
      limit: input.limit + 1,
    })
    return c.json(page(records, input), 200)
  })
  app.post("/api/v1/maintenance/shapes", async (c) => {
    const key = c.req.header("idempotency-key")?.trim()
    if (!key)
      return problem(
        400,
        "idempotency-key-required",
        "idempotency_key_required",
        "Idempotency-Key required",
        "Shape create requires an Idempotency-Key header",
        c.req.path
      )
    const parsedHeaders = shapeCreateInputSchema.shape.headers.safeParse({
      "idempotency-key": key,
    })
    if (!parsedHeaders.success)
      return problem(
        400,
        "invalid-idempotency-key",
        "invalid_idempotency_key",
        "Invalid Idempotency-Key",
        "Idempotency-Key must contain at most 255 characters",
        c.req.path
      )
    const fields = await parseBody(c.req.raw)
    if (fields instanceof Response) return fields
    const input = shapeCreateInputSchema.parse({
      headers: parsedHeaders.data,
      body: fields,
    })
    try {
      const result = await dependencies.createShape({
        collectorId: c.get("collector").id,
        idempotencyKey: input.headers["idempotency-key"],
        requestHash: await digest(JSON.stringify(input.body)),
        expiresAt: new Date(Date.now() + 86400000),
        fields: input.body,
      })
      if (result.status === "mismatch")
        return problem(
          409,
          "idempotency-key-reuse",
          "idempotency_key_reused",
          "Idempotency-Key already used",
          "This Idempotency-Key was already used with a different payload",
          c.req.path
        )
      const data = serialize(result.shape)
      return c.json({ data }, 201, {
        ETag: data.etag,
        Location: `/api/v1/maintenance/shapes/${data.id}`,
      })
    } catch (error) {
      return mapError(error, "create", c.req.path)
    }
  })
  app.all("/api/v1/maintenance/shapes", (c) => method(c.req.path, "GET, POST"))
  app.get("/api/v1/maintenance/shapes/options", async (c) => {
    const input = parseCollection(c.req.url, true)
    if (input instanceof Response) return input
    const records = await dependencies.listShapes({
      q: input.q,
      cursor: input.cursor,
      limit: input.limit + 1,
      sort: "name",
      order: "asc",
    })
    const result = page(records, { ...input, sort: "name", order: "asc" })
    return c.json(
      {
        data: result.data.map(({ id, code, name }) => ({ id, code, name })),
        nextCursor: result.nextCursor,
      },
      200
    )
  })
  app.all("/api/v1/maintenance/shapes/options", (c) => method(c.req.path, "GET"))
  app.get("/api/v1/maintenance/shapes/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!shapeDetailInputSchema.safeParse({ uuid: id }).success)
      return invalidId(c.req.path)
    const record = await dependencies.getShape(id)
    if (!record) return notFound(c.req.path)
    return c.json({ data: serialize(record) }, 200, { ETag: etag(record) })
  })
  app.put("/api/v1/maintenance/shapes/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!shapeReplaceInputSchema.shape.params.safeParse({ uuid: id }).success)
      return invalidId(c.req.path)
    const version = precondition(c.req.header("if-match"), id, c.req.path)
    if (version instanceof Response) return version
    const fields = await parseBody(c.req.raw)
    if (fields instanceof Response) return fields
    const input = shapeReplaceInputSchema.parse({
      params: { uuid: id },
      headers: { "if-match": c.req.header("if-match") },
      body: fields,
    })
    try {
      const result = await dependencies.replaceShape({
        id: input.params.uuid,
        expectedVersion: version,
        fields: input.body,
      })
      if (result.status !== "updated")
        return result.status === "missing"
          ? notFound(c.req.path)
          : stale(c.req.path)
      const data = serialize(result.shape)
      return c.json({ data }, 200, { ETag: data.etag })
    } catch (error) {
      return mapError(error, "replace", c.req.path)
    }
  })
  app.delete("/api/v1/maintenance/shapes/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!shapeDeleteInputSchema.shape.params.safeParse({ uuid: id }).success)
      return invalidId(c.req.path)
    const version = precondition(c.req.header("if-match"), id, c.req.path)
    if (version instanceof Response) return version
    const input = shapeDeleteInputSchema.parse({
      params: { uuid: id },
      headers: { "if-match": c.req.header("if-match") },
    })
    try {
      const result = await dependencies.deleteShape({
        id: input.params.uuid,
        expectedVersion: version,
      })
      if (result.status === "missing") return notFound(c.req.path)
      if (result.status === "stale") return stale(c.req.path)
      return c.body(null, 204)
    } catch (error) {
      return mapError(error, "delete", c.req.path)
    }
  })
  app.all("/api/v1/maintenance/shapes/:uuid", (c) =>
    method(c.req.path, "GET, PUT, DELETE")
  )
}

type ShapeCollectionInput = {
  q?: string
  cursor?: Cursor
  limit: number
  sort: "code" | "name"
  order: "asc" | "desc"
}
function parseCollection(
  url: string,
  optionsOnly: boolean
): ShapeCollectionInput | Response {
  const requestUrl = new URL(url),
    names = optionsOnly
      ? ["q", "cursor", "limit"]
      : ["q", "cursor", "limit", "sort", "order"]
  for (const key of requestUrl.searchParams.keys())
    if (!names.includes(key)) return invalidQuery(requestUrl.pathname)
  const raw: Record<string, unknown> = {}
  for (const name of names) {
    const values = requestUrl.searchParams.getAll(name)
    if (values.length > 1 || values.some((v) => !v.trim()))
      return invalidQuery(requestUrl.pathname)
    const value = requestUrl.searchParams.get(name)
    if (value !== null) raw[name] = name === "limit" ? Number(value) : value
  }
  const parsed = (
    optionsOnly ? shapeOptionsInputSchema : shapeListInputSchema
  ).safeParse(raw)
  if (!parsed.success) return invalidQuery(requestUrl.pathname)
  const sort = optionsOnly
      ? "name"
      : ((raw.sort as ShapeCollectionInput["sort"] | undefined) ?? "name"),
    order = optionsOnly
      ? "asc"
      : ((raw.order as ShapeCollectionInput["order"] | undefined) ?? "asc")
  const cursor =
    parsed.data.cursor === undefined
      ? undefined
      : decodeCursor(parsed.data.cursor, sort, order)
  return parsed.data.cursor !== undefined && !cursor
    ? invalidQuery(requestUrl.pathname)
    : { q: parsed.data.q, cursor, limit: parsed.data.limit ?? 30, sort, order }
}
function page(
  records: (ShapeSourceRecord & {
    cursorValue: string
    cursorSecondaryValue: string
  })[],
  input: Pick<ShapeCollectionInput, "limit" | "sort" | "order">
) {
  const selected = records.slice(0, input.limit),
    last = records.length > selected.length ? selected.at(-1) : undefined
  return {
    data: selected.map(serialize),
    nextCursor: last
      ? encodeCursor({
          value: last.cursorValue,
          secondaryValue: last.cursorSecondaryValue,
          id: last.id,
          sort: input.sort,
          order: input.order,
        })
      : null,
  }
}
function serialize(
  record: ShapeSourceRecord & {
    cursorValue?: string
    cursorSecondaryValue?: string
  }
): Shape {
  const {
    cursorValue: _cursorValue,
    cursorSecondaryValue: _cursorSecondaryValue,
    ...source
  } = record
  return {
    ...source,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    etag: etag(source),
  }
}
async function parseBody(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problem(
      400,
      "invalid-json",
      "invalid_json",
      "Invalid JSON body",
      "The request body must be valid JSON",
      new URL(request.url).pathname
    )
  }
  const parsed = shapeMutationBodySchema.safeParse(body)
  if (parsed.success) return parsed.data
  return problem(
    422,
    "shape-validation",
    "shape_validation_failed",
    "Shape validation failed",
    "The Shape could not be saved",
    new URL(request.url).pathname,
    parsed.error.issues.map((issue) => {
      const pathField = issue.path.at(0)
      if (pathField !== "code" && pathField !== "name") {
        return {
          name: "/",
          code: "shape_body_invalid",
          reason: "The Shape request body must be an object.",
        }
      }
      const field = pathField
      const failure =
        issue.code === "too_small"
          ? "required"
          : issue.code === "too_big"
            ? "too_long"
            : "invalid"
      return {
        name: `/${field}`,
        code: `shape_${field}_${failure}`,
        reason:
          failure === "required"
            ? `Shape ${field === "code" ? "Code" : "Name"} must not be blank.`
            : failure === "too_long"
              ? `Shape ${field === "code" ? "Code" : "Name"} must contain at most 255 characters.`
              : `Shape ${field === "code" ? "Code" : "Name"} is invalid.`,
      }
    })
  )
}
function precondition(
  value: string | undefined,
  id: string,
  instance: string
): number | Response {
  if (!value)
    return problem(
      400,
      "if-match-required",
      "if_match_required",
      "If-Match required",
      "Shape replacement and deletion require an If-Match header",
      instance
    )
  try {
    if (!/^"[A-Za-z0-9_-]+"$/.test(value)) throw Error()
    const text = from64(value.slice(1, -1)),
      split = text.lastIndexOf(":"),
      version = Number(text.slice(split + 1))
    if (
      text.slice(0, split) !== id ||
      !Number.isInteger(version) ||
      version < 1
    )
      throw Error()
    return version
  } catch {
    return problem(
      400,
      "invalid-if-match",
      "invalid_if_match",
      "Invalid If-Match",
      "If-Match does not identify this Shape version",
      instance
    )
  }
}
function mapError(
  error: unknown,
  operation: "create" | "replace" | "delete",
  instance: string
): Response {
  if (constraint(error, "23505", "shape_code_lower_unique_idx"))
    return problem(
      409,
      "shape-code-conflict",
      "shape_code_conflict",
      "Shape Code already exists",
      "Another Shape already uses this Shape Code",
      instance
    )
  if (
    operation === "delete" &&
    constraint(error, "23001", "coin_shape_id_shape_id_fk")
  )
    return problem(
      409,
      "shape-in-use",
      "shape_in_use",
      "Shape is in use",
      "Coins still use this Shape, so it cannot be deleted",
      instance
    )
  throw error
}
function constraint(error: unknown, code: string, name: string) {
  const postgresError =
    typeof error === "object" &&
    error &&
    "cause" in error &&
    error.cause &&
    typeof error.cause === "object"
      ? error.cause
      : error
  return (
    typeof postgresError === "object" &&
    postgresError &&
    "code" in postgresError &&
    postgresError.code === code &&
    "constraint_name" in postgresError &&
    postgresError.constraint_name === name
  )
}
function problem(
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
      ...(invalidParams ? { invalidParams } : {}),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "private, no-store",
        ...headers,
      },
    }
  )
}
function invalidQuery(instance: string) {
  return problem(
    400,
    "invalid-query",
    "invalid_request",
    "Invalid query parameters",
    "Query parameters do not match the maintenance API contract",
    instance
  )
}
function invalidId(instance: string) {
  return problem(
    400,
    "invalid-shape-uuid",
    "invalid_shape_uuid",
    "Invalid Shape UUID",
    "Shape UUID is invalid",
    instance
  )
}
function notFound(instance: string) {
  return problem(
    404,
    "shape-not-found",
    "shape_not_found",
    "Shape not found",
    "No Shape matches this UUID",
    instance
  )
}
function stale(instance: string) {
  return problem(
    412,
    "stale-shape",
    "shape_precondition_failed",
    "Shape changed",
    "The Shape changed after it was loaded; reload before retrying",
    instance
  )
}
function method(instance: string, allow: string) {
  return problem(
    405,
    "method-not-allowed",
    "method_not_allowed",
    "Method Not Allowed",
    `Only ${allow} are supported`,
    instance,
    undefined,
    { Allow: allow }
  )
}
function etag(record: Pick<ShapeSourceRecord, "id" | "version">) {
  return `"${to64(`${record.id}:${record.version}`)}"`
}
function encodeCursor(value: Cursor & { sort: string; order: string }) {
  return to64(JSON.stringify(value))
}
function decodeCursor(
  value: string,
  sort: string,
  order: string
): Cursor | undefined {
  try {
    const data: unknown = JSON.parse(from64(value))
    if (
      typeof data === "object" &&
      data &&
      "value" in data &&
      "secondaryValue" in data &&
      "id" in data &&
      "sort" in data &&
      "order" in data &&
      typeof data.value === "string" &&
      typeof data.secondaryValue === "string" &&
      typeof data.id === "string" &&
      data.sort === sort &&
      data.order === order &&
      uuid(data.id)
    )
      return {
        value: data.value,
        secondaryValue: data.secondaryValue,
        id: data.id,
      }
  } catch {}
  return undefined
}
function to64(value: string) {
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}
function from64(value: string) {
  return atob(
    value
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=")
  )
}
async function digest(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  )
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}
