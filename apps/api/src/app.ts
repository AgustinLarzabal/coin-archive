import { OpenAPIGenerator } from "@orpc/openapi"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { browseCoinsInputSchema, publicApiContract } from "@coin-archive/api"
import type { BrowseCoinsInput, BrowseCoinsOutput } from "@coin-archive/api"
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

export function createPublicApiApp({
  browseCoins,
  environment,
  surfaceImageOrigin,
  rateLimit = async () => true,
}: {
  browseCoins: BrowseCoins
  environment: "staging" | "production"
  surfaceImageOrigin: string
  rateLimit?: (clientIp: string) => Promise<boolean>
}) {
  const app = new Hono()
  const allowedOrigin =
    environment === "production"
      ? "https://coinarchive.app"
      : "https://staging.coinarchive.app"

  app.use("/api/*", async (context, next) => {
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
      "Only GET and HEAD are supported",
      "/api/v1/coins"
    )
  )

  app.get("/api/v1/openapi.json", async (context) => {
    const document = await new OpenAPIGenerator({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }).generate(publicApiContract, {
      info: { title: "Coin Archive public API", version: "1.0.0" },
    })
    return context.json(document, 200, { "Cache-Control": cacheControl })
  })

  return app
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
  headers: Record<string, string> = {}
) {
  return new Response(
    JSON.stringify({
      type: `https://api.coinarchive.app/problems/${status}`,
      title,
      status,
      detail,
      instance,
      ...(invalidParams === undefined ? {} : { invalidParams }),
    }),
    {
      status,
      headers: { "Content-Type": "application/problem+json", ...headers },
    }
  )
}
