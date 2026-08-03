import { coinMaintenanceListInputSchema } from "@coin-archive/api"
import type {
  CoinMaintenanceDeleteSummary,
  CoinMaintenanceDetail,
  CoinMaintenanceListInput,
  CoinMaintenanceListItem,
  CoinMaintenanceOptionsOutput,
} from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"

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
}

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

  app.all("/api/v1/maintenance/coins", (context) =>
    methodNotAllowed(context.req.path)
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

  app.all("/api/v1/maintenance/coins/:uuid", (context) =>
    methodNotAllowed(context.req.path)
  )
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
function coinNotFound(instance: string) {
  return problem(
    404,
    "Coin not found",
    "No Coin matches this UUID",
    instance,
    "coin_not_found"
  )
}
function methodNotAllowed(instance: string) {
  const response = problem(
    405,
    "Method Not Allowed",
    "Only GET is supported",
    instance,
    "method_not_allowed"
  )
  response.headers.set("Allow", "GET")
  return response
}
