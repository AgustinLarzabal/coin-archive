import {
  issuerCreateInputSchema,
  issuerDeleteInputSchema,
  issuerDetailInputSchema,
  issuerListInputSchema,
  issuerMutationBodySchema,
  issuerOptionsInputSchema,
  issuerReplaceInputSchema,
} from "@coin-archive/api"
import type {
  Issuer,
  IssuerListInput,
  IssuerMutationBody,
} from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"

const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000

type IssuerSourceRecord = Omit<Issuer, "createdAt" | "updatedAt" | "etag"> & {
  createdAt: Date
  updatedAt: Date
}
type Cursor = { value: string; secondaryValue: string; id: string }
export type IssuerMaintenanceDependencies = {
  listIssuers: (
    input: Required<Pick<IssuerListInput, "limit" | "sort" | "order">> & {
      q?: string
      cursor?: Cursor
    }
  ) => Promise<
    (IssuerSourceRecord & {
      cursorValue: string
      cursorSecondaryValue: string
    })[]
  >
  getIssuer: (id: string) => Promise<IssuerSourceRecord | null>
  createIssuer: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    fields: IssuerMutationBody
  }) => Promise<
    | { status: "created" | "replayed"; issuer: IssuerSourceRecord }
    | { status: "mismatch" }
  >
  replaceIssuer: (input: {
    id: string
    expectedVersion: number
    fields: IssuerMutationBody
  }) => Promise<
    | { status: "updated"; issuer: IssuerSourceRecord }
    | { status: "missing" | "stale" }
  >
  deleteIssuer: (input: {
    id: string
    expectedVersion: number
  }) => Promise<
    | { status: "deleted"; issuer: IssuerSourceRecord }
    | { status: "missing" | "stale" }
  >
}
type Env = { Variables: { collector: MaintenanceCollector; requestId: string } }

export function registerIssuerMaintenanceRoutes(
  app: Hono<Env>,
  dependencies: IssuerMaintenanceDependencies
) {
  app.get("/api/v1/maintenance/issuers", async (c) => {
    const input = parseCollection(c.req.url, false)
    if (input instanceof Response) return input
    const records = await dependencies.listIssuers({
      ...input,
      limit: input.limit + 1,
    })
    return c.json(page(records, input), 200)
  })
  app.post("/api/v1/maintenance/issuers", async (c) => {
    const key = c.req.header("idempotency-key")?.trim()
    if (!key)
      return problem(
        400,
        "idempotency-key-required",
        "idempotency_key_required",
        "Idempotency-Key required",
        "Issuer create requires an Idempotency-Key header",
        c.req.path
      )
    const parsedHeaders = issuerCreateInputSchema.shape.headers.safeParse({
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
    const input = issuerCreateInputSchema.parse({
      headers: parsedHeaders.data,
      body: fields,
    })
    try {
      const result = await dependencies.createIssuer({
        collectorId: c.get("collector").id,
        idempotencyKey: input.headers["idempotency-key"],
        requestHash: await digest(JSON.stringify(input.body)),
        expiresAt: new Date(Date.now() + IDEMPOTENCY_RETENTION_MS),
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
      const data = serialize(result.issuer)
      return c.json({ data }, 201, {
        ETag: data.etag,
        Location: `/api/v1/maintenance/issuers/${data.id}`,
      })
    } catch (error) {
      return mapError(error, "create", c.req.path)
    }
  })
  app.all("/api/v1/maintenance/issuers", (c) => method(c.req.path, "GET, POST"))
  app.get("/api/v1/maintenance/issuers/options", async (c) => {
    const input = parseCollection(c.req.url, true)
    if (input instanceof Response) return input
    const records = await dependencies.listIssuers({
      q: input.q,
      cursor: input.cursor,
      limit: input.limit + 1,
      sort: "name",
      order: "asc",
    })
    const result = page(records, { ...input, sort: "name", order: "asc" })
    return c.json(
      {
        data: result.data.map(({ id, code, isoCode, name }) => ({
          id,
          code,
          isoCode,
          name,
        })),
        nextCursor: result.nextCursor,
      },
      200
    )
  })
  app.all("/api/v1/maintenance/issuers/options", (c) =>
    method(c.req.path, "GET")
  )
  app.get("/api/v1/maintenance/issuers/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!issuerDetailInputSchema.safeParse({ uuid: id }).success)
      return invalidId(c.req.path)
    const record = await dependencies.getIssuer(id)
    if (!record) return notFound(c.req.path)
    return c.json({ data: serialize(record) }, 200, { ETag: etag(record) })
  })
  app.put("/api/v1/maintenance/issuers/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!issuerReplaceInputSchema.shape.params.safeParse({ uuid: id }).success)
      return invalidId(c.req.path)
    const version = precondition(c.req.header("if-match"), id, c.req.path)
    if (version instanceof Response) return version
    const fields = await parseBody(c.req.raw)
    if (fields instanceof Response) return fields
    const input = issuerReplaceInputSchema.parse({
      params: { uuid: id },
      headers: { "if-match": c.req.header("if-match") },
      body: fields,
    })
    if (input.body.parentIssuerId === input.params.uuid) {
      return validationProblem(
        c.req.path,
        "/parentIssuerId",
        "issuer_self_parent",
        "Issuer cannot be its own Parent Issuer."
      )
    }
    try {
      const result = await dependencies.replaceIssuer({
        id: input.params.uuid,
        expectedVersion: version,
        fields: input.body,
      })
      if (result.status !== "updated")
        return result.status === "missing"
          ? notFound(c.req.path)
          : stale(c.req.path)
      const data = serialize(result.issuer)
      return c.json({ data }, 200, { ETag: data.etag })
    } catch (error) {
      return mapError(error, "replace", c.req.path)
    }
  })
  app.delete("/api/v1/maintenance/issuers/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!issuerDeleteInputSchema.shape.params.safeParse({ uuid: id }).success)
      return invalidId(c.req.path)
    const version = precondition(c.req.header("if-match"), id, c.req.path)
    if (version instanceof Response) return version
    const input = issuerDeleteInputSchema.parse({
      params: { uuid: id },
      headers: { "if-match": c.req.header("if-match") },
    })
    try {
      const result = await dependencies.deleteIssuer({
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
  app.all("/api/v1/maintenance/issuers/:uuid", (c) =>
    method(c.req.path, "GET, PUT, DELETE")
  )
}

type IssuerCollectionInput = {
  q?: string
  cursor?: Cursor
  limit: number
  sort: "code" | "isoCode" | "name"
  order: "asc" | "desc"
}
function parseCollection(
  url: string,
  optionsOnly: boolean
): IssuerCollectionInput | Response {
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
    optionsOnly ? issuerOptionsInputSchema : issuerListInputSchema
  ).safeParse(raw)
  if (!parsed.success) return invalidQuery(requestUrl.pathname)
  const sort = optionsOnly
      ? "name"
      : ((raw.sort as IssuerCollectionInput["sort"] | undefined) ?? "name"),
    order = optionsOnly
      ? "asc"
      : ((raw.order as IssuerCollectionInput["order"] | undefined) ?? "asc")
  const cursor =
    parsed.data.cursor === undefined
      ? undefined
      : decodeCursor(parsed.data.cursor, sort, order)
  return parsed.data.cursor !== undefined && !cursor
    ? invalidQuery(requestUrl.pathname)
    : { q: parsed.data.q, cursor, limit: parsed.data.limit ?? 30, sort, order }
}
function page(
  records: (IssuerSourceRecord & {
    cursorValue: string
    cursorSecondaryValue: string
  })[],
  input: Pick<IssuerCollectionInput, "limit" | "sort" | "order">
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
  record: IssuerSourceRecord & {
    cursorValue?: string
    cursorSecondaryValue?: string
  }
): Issuer {
  return {
    id: record.id,
    code: record.code,
    isoCode: record.isoCode,
    name: record.name,
    parentIssuerId: record.parentIssuerId,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    etag: etag(record),
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
  const parsed = issuerMutationBodySchema.safeParse(body)
  if (parsed.success) return parsed.data
  return problem(
    422,
    "issuer-validation",
    "issuer_validation_failed",
    "Issuer validation failed",
    "The Issuer could not be saved",
    new URL(request.url).pathname,
    parsed.error.issues.map((issue) => {
      const pathField = issue.path.at(0)
      if (
        pathField !== "code" &&
        pathField !== "isoCode" &&
        pathField !== "name" &&
        pathField !== "parentIssuerId"
      ) {
        return {
          name: "/",
          code: "issuer_body_invalid",
          reason: "The Issuer request body must be an object.",
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
        code:
          field === "parentIssuerId"
            ? "issuer_parent_invalid"
            : field === "isoCode"
              ? `issuer_iso_code_${failure}`
              : `issuer_${field}_${failure}`,
        reason:
          field === "parentIssuerId"
            ? "Parent Issuer must be a valid UUID or null."
            : failure === "required"
              ? `Issuer ${field === "code" ? "Code" : field === "isoCode" ? "ISO Code" : "Name"} must not be blank.`
              : failure === "too_long"
                ? `Issuer ${field === "code" ? "Code" : "Name"} must contain at most 255 characters.`
                : `Issuer ${field === "code" ? "Code" : field === "isoCode" ? "ISO Code" : "Name"} is invalid.`,
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
      "Issuer replacement and deletion require an If-Match header",
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
      "If-Match does not identify this Issuer version",
      instance
    )
  }
}
function mapError(
  error: unknown,
  operation: "create" | "replace" | "delete",
  instance: string
): Response {
  if (constraint(error, "23505", "issuer_code_unique_idx"))
    return problem(
      409,
      "issuer-code-conflict",
      "issuer_code_conflict",
      "Issuer Code already exists",
      "Another Issuer already uses this Issuer Code",
      instance
    )
  if (
    operation === "delete" &&
    constraint(error, "23001", "coin_issuer_id_issuer_id_fk")
  )
    return problem(
      409,
      "issuer-in-use",
      "issuer_in_use",
      "Issuer is in use",
      "Coins still use this Issuer, so it cannot be deleted",
      instance
    )
  if (
    operation === "delete" &&
    constraint(error, "23001", "issuer_parent_issuer_id_issuer_id_fk")
  )
    return problem(
      409,
      "issuer-has-children",
      "issuer_has_children",
      "Issuer has child Issuers",
      "Child Issuers still reference this Issuer, so it cannot be deleted",
      instance
    )
  if (constraint(error, "23503", "issuer_parent_issuer_id_issuer_id_fk"))
    return validationProblem(
      instance,
      "/parentIssuerId",
      "issuer_parent_not_found",
      "Selected Parent Issuer no longer exists."
    )
  if (constraint(error, "23514", "issuer_parent_issuer_id_self_check"))
    return validationProblem(
      instance,
      "/parentIssuerId",
      "issuer_self_parent",
      "Issuer cannot be its own Parent Issuer."
    )
  if (constraint(error, "23514", "issuer_parent_issuer_id_cycle_check"))
    return validationProblem(
      instance,
      "/parentIssuerId",
      "issuer_parent_cycle",
      "Parent Issuer cannot be a descendant of this Issuer."
    )
  throw error
}
function validationProblem(
  instance: string,
  name: "/parentIssuerId",
  code:
    | "issuer_parent_not_found"
    | "issuer_self_parent"
    | "issuer_parent_cycle",
  reason: string
) {
  return problem(
    422,
    "issuer-validation",
    code,
    "Issuer validation failed",
    reason,
    instance,
    [{ name, code, reason }]
  )
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
    "invalid-issuer-uuid",
    "invalid_issuer_uuid",
    "Invalid Issuer UUID",
    "Issuer UUID is invalid",
    instance
  )
}
function notFound(instance: string) {
  return problem(
    404,
    "issuer-not-found",
    "issuer_not_found",
    "Issuer not found",
    "No Issuer matches this UUID",
    instance
  )
}
function stale(instance: string) {
  return problem(
    412,
    "stale-issuer",
    "issuer_precondition_failed",
    "Issuer changed",
    "The Issuer changed after it was loaded; reload before retrying",
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
function etag(record: Pick<IssuerSourceRecord, "id" | "version">) {
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
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}
function from64(value: string) {
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
