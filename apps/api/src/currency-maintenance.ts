import {
  currencyCreateInputSchema,
  currencyDeleteInputSchema,
  currencyDetailInputSchema,
  currencyListInputSchema,
  currencyMutationBodySchema,
  currencyOptionsInputSchema,
  currencyReplaceInputSchema,
} from "@coin-archive/api"
import type { Currency, CurrencyListInput } from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"

type CurrencySource = Omit<Currency, "createdAt" | "updatedAt" | "etag"> & {
  createdAt: Date
  updatedAt: Date
}
type Cursor = { value: string; secondaryValue: string; id: string }
export type CurrencyMaintenanceDependencies = {
  listCurrencies: (
    input: Required<Pick<CurrencyListInput, "limit" | "sort" | "order">> & {
      q?: string
      cursor?: Cursor
    }
  ) => Promise<
    (CurrencySource & { cursorValue: string; cursorSecondaryValue: string })[]
  >
  getCurrency: (id: string) => Promise<CurrencySource | null>
  createCurrency: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    fields: { code: string; name: string; fullName: string }
  }) => Promise<
    | { status: "created" | "replayed"; currency: CurrencySource }
    | { status: "mismatch" }
  >
  replaceCurrency: (input: {
    id: string
    expectedVersion: number
    fields: { code: string; name: string; fullName: string }
  }) => Promise<
    | { status: "updated"; currency: CurrencySource }
    | { status: "missing" | "stale" }
  >
  deleteCurrency: (input: {
    id: string
    expectedVersion: number
  }) => Promise<
    | { status: "deleted"; currency: CurrencySource }
    | { status: "missing" | "stale" }
  >
}
type Env = { Variables: { collector: MaintenanceCollector; requestId: string } }

export function registerCurrencyMaintenanceRoutes(
  app: Hono<Env>,
  dependencies: CurrencyMaintenanceDependencies
) {
  app.get("/api/v1/maintenance/currencies", async (c) => {
    const input = parseCollection(c.req.url, false)
    if (input instanceof Response) return input
    const records = await dependencies.listCurrencies({
      ...input,
      limit: input.limit + 1,
    })
    return c.json(page(records, input), 200)
  })
  app.post("/api/v1/maintenance/currencies", async (c) => {
    const key = c.req.header("idempotency-key")?.trim()
    if (!key)
      return problem(
        400,
        "idempotency-key-required",
        "idempotency_key_required",
        "Idempotency-Key required",
        "Currency create requires an Idempotency-Key header",
        c.req.path
      )
    if (key.length > 255)
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
    const requestInput = currencyCreateInputSchema.safeParse({
      headers: { "idempotency-key": key },
      body: fields,
    })
    if (!requestInput.success) return invalidRequest(c.req.path)
    try {
      const result = await dependencies.createCurrency({
        collectorId: c.get("collector").id,
        idempotencyKey: requestInput.data.headers["idempotency-key"],
        requestHash: await digest(JSON.stringify(requestInput.data.body)),
        expiresAt: new Date(Date.now() + 86400000),
        fields: requestInput.data.body,
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
      const data = serialize(result.currency)
      return c.json({ data }, 201, {
        ETag: data.etag,
        Location: `/api/v1/maintenance/currencies/${data.id}`,
      })
    } catch (error) {
      return mapError(error, "create", c.req.path)
    }
  })
  app.all("/api/v1/maintenance/currencies", (c) =>
    method(c.req.path, "GET, POST")
  )
  app.get("/api/v1/maintenance/currencies/options", async (c) => {
    const input = parseCollection(c.req.url, true)
    if (input instanceof Response) return input
    const records = await dependencies.listCurrencies({
      q: input.q,
      cursor: input.cursor,
      limit: input.limit + 1,
      sort: "name",
      order: "asc",
    })
    const result = page(records, { ...input, sort: "name", order: "asc" })
    return c.json(
      {
        data: result.data.map(({ id, code, name, fullName }) => ({
          id,
          code,
          name,
          fullName,
        })),
        nextCursor: result.nextCursor,
      },
      200
    )
  })
  app.all("/api/v1/maintenance/currencies/options", (c) =>
    method(c.req.path, "GET")
  )
  app.get("/api/v1/maintenance/currencies/:uuid", async (c) => {
    const requestInput = currencyDetailInputSchema.safeParse({
      uuid: c.req.param("uuid"),
    })
    if (!requestInput.success) return invalidId(c.req.path)
    const id = requestInput.data.uuid
    const record = await dependencies.getCurrency(id)
    if (!record) return notFound(c.req.path)
    return c.json({ data: serialize(record) }, 200, { ETag: etag(record) })
  })
  app.put("/api/v1/maintenance/currencies/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!uuid(id)) return invalidId(c.req.path)
    const fields = await parseBody(c.req.raw)
    if (fields instanceof Response) return fields
    const requestInput = currencyReplaceInputSchema.safeParse({
      params: { uuid: id },
      headers: { "if-match": c.req.header("if-match") },
      body: fields,
    })
    if (!requestInput.success) {
      return c.req.header("if-match")
        ? invalidRequest(c.req.path)
        : ifMatchRequired(c.req.path)
    }
    const version = precondition(
      requestInput.data.headers["if-match"],
      id,
      c.req.path
    )
    if (version instanceof Response) return version
    try {
      const result = await dependencies.replaceCurrency({
        id,
        expectedVersion: version,
        fields: requestInput.data.body,
      })
      if (result.status !== "updated")
        return result.status === "missing"
          ? notFound(c.req.path)
          : stale(c.req.path)
      const data = serialize(result.currency)
      return c.json({ data }, 200, { ETag: data.etag })
    } catch (error) {
      return mapError(error, "replace", c.req.path)
    }
  })
  app.delete("/api/v1/maintenance/currencies/:uuid", async (c) => {
    const id = c.req.param("uuid")
    if (!uuid(id)) return invalidId(c.req.path)
    const requestInput = currencyDeleteInputSchema.safeParse({
      params: { uuid: id },
      headers: { "if-match": c.req.header("if-match") },
    })
    if (!requestInput.success) {
      return c.req.header("if-match")
        ? invalidRequest(c.req.path)
        : ifMatchRequired(c.req.path)
    }
    const version = precondition(
      requestInput.data.headers["if-match"],
      id,
      c.req.path
    )
    if (version instanceof Response) return version
    try {
      const result = await dependencies.deleteCurrency({
        id,
        expectedVersion: version,
      })
      if (result.status === "missing") return notFound(c.req.path)
      if (result.status === "stale") return stale(c.req.path)
      return c.body(null, 204)
    } catch (error) {
      return mapError(error, "delete", c.req.path)
    }
  })
  app.all("/api/v1/maintenance/currencies/:uuid", (c) =>
    method(c.req.path, "GET, PUT, DELETE")
  )
}

type CurrencyCollectionInput = {
  q?: string
  cursor?: Cursor
  limit: number
  sort: "code" | "fullName" | "name"
  order: "asc" | "desc"
}
function parseCollection(
  url: string,
  optionsOnly: boolean
): CurrencyCollectionInput | Response {
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
    optionsOnly ? currencyOptionsInputSchema : currencyListInputSchema
  ).safeParse(raw)
  if (!parsed.success) return invalidQuery(requestUrl.pathname)
  const sort = optionsOnly
      ? "name"
      : ((raw.sort as CurrencyCollectionInput["sort"] | undefined) ?? "name"),
    order = optionsOnly
      ? "asc"
      : ((raw.order as CurrencyCollectionInput["order"] | undefined) ?? "asc")
  const cursor =
    parsed.data.cursor === undefined
      ? undefined
      : decodeCursor(parsed.data.cursor, sort, order)
  return parsed.data.cursor !== undefined && !cursor
    ? invalidQuery(requestUrl.pathname)
    : { q: parsed.data.q, cursor, limit: parsed.data.limit ?? 30, sort, order }
}
function page(
  records: (CurrencySource & {
    cursorValue: string
    cursorSecondaryValue: string
  })[],
  input: Pick<CurrencyCollectionInput, "limit" | "sort" | "order">
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
  record: CurrencySource & {
    cursorValue?: string
    cursorSecondaryValue?: string
  }
): Currency {
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
  const parsed = currencyMutationBodySchema.safeParse(body)
  if (parsed.success) return parsed.data
  return problem(
    422,
    "currency-validation",
    "currency_validation_failed",
    "Currency validation failed",
    "The Currency could not be saved",
    new URL(request.url).pathname,
    parsed.error.issues.map((issue) => {
      const field = issue.path.at(0) as "code" | "name" | "fullName"
      const failure =
        issue.code === "too_small"
          ? "required"
          : issue.code === "too_big"
            ? "too_long"
            : "invalid"
      const label =
        field === "code" ? "Code" : field === "fullName" ? "Full Name" : "Name"
      const fieldCode = field === "fullName" ? "full_name" : field
      return {
        name: `/${field}`,
        code: `currency_${fieldCode}_${failure}`,
        reason:
          failure === "required"
            ? `Currency ${label} must not be blank.`
            : failure === "too_long"
              ? `Currency ${label} must contain at most 255 characters.`
              : `Currency ${label} is invalid.`,
      }
    })
  )
}
function precondition(
  value: string | undefined,
  id: string,
  instance: string
): number | Response {
  if (!value) return ifMatchRequired(instance)
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
      "If-Match does not identify this Currency version",
      instance
    )
  }
}
function ifMatchRequired(instance: string) {
  return problem(
    400,
    "if-match-required",
    "if_match_required",
    "If-Match required",
    "Currency replacement and deletion require an If-Match header",
    instance
  )
}
function mapError(
  error: unknown,
  operation: "create" | "replace" | "delete",
  instance: string
): Response {
  if (constraint(error, "23505", "currency_code_lower_unique_idx"))
    return problem(
      409,
      "currency-code-conflict",
      "currency_code_conflict",
      "Currency Code already exists",
      "Another Currency already uses this Currency Code",
      instance
    )
  if (
    operation === "delete" &&
    constraint(error, "23001", "coin_currency_id_currency_id_fk")
  )
    return problem(
      409,
      "currency-in-use",
      "currency_in_use",
      "Currency is in use",
      "Coins still use this Currency in their Face Values, so it cannot be deleted",
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
function invalidRequest(instance: string) {
  return problem(
    400,
    "invalid-request",
    "invalid_request",
    "Invalid request",
    "The request does not match the Currency maintenance contract",
    instance
  )
}
function invalidId(instance: string) {
  return problem(
    400,
    "invalid-currency-uuid",
    "invalid_currency_uuid",
    "Invalid Currency UUID",
    "Currency UUID is invalid",
    instance
  )
}
function notFound(instance: string) {
  return problem(
    404,
    "currency-not-found",
    "currency_not_found",
    "Currency not found",
    "No Currency matches this UUID",
    instance
  )
}
function stale(instance: string) {
  return problem(
    412,
    "stale-currency",
    "currency_precondition_failed",
    "Currency changed",
    "The Currency changed after it was loaded; reload before retrying",
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
function etag(record: Pick<CurrencySource, "id" | "version">) {
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
