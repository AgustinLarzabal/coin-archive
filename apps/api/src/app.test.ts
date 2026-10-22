import { describe, expect, it } from "vitest"

import { createApp } from "./app.js"

const successfulReadinessCheck = async () => {}

describe("API composition", () => {
  it("preserves bounded request IDs and replaces missing or invalid IDs", async () => {
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    })
    const validRequestId = "browser.trace_123:child-4"
    const preserved = await app.request("/health", {
      headers: { "x-request-id": validRequestId },
    })
    const missing = await app.request("/health")
    const invalid = await app.request("/health", {
      headers: { "x-request-id": "invalid request id" },
    })

    expect(preserved.headers.get("x-request-id")).toBe(validRequestId)
    expect(missing.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
    expect(invalid.headers.get("x-request-id")).not.toBe("invalid request id")
  })

  it("allows only configured browser origins without credentials", async () => {
    const app = createApp({
      allowedOrigins: ["https://coin-archive.example"],
      checkReadiness: successfulReadinessCheck,
    })
    const allowed = await app.request("/health", {
      headers: { origin: "https://coin-archive.example" },
    })
    const unlisted = await app.request("/health", {
      headers: { origin: "https://attacker.example" },
    })
    const preflight = await app.request("/health", {
      method: "OPTIONS",
      headers: {
        origin: "https://coin-archive.example",
        "access-control-request-method": "GET",
      },
    })

    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "https://coin-archive.example"
    )
    expect(allowed.headers.has("access-control-allow-credentials")).toBe(false)
    expect(unlisted.headers.has("access-control-allow-origin")).toBe(false)
    expect(preflight.headers.get("access-control-allow-origin")).toBe(
      "https://coin-archive.example"
    )
    expect(preflight.headers.has("access-control-allow-credentials")).toBe(
      false
    )
    expect(preflight.headers.get("x-request-id")).toBeTruthy()
  })

  it("returns consistent public JSON errors for unknown routes and failures", async () => {
    const lines: Array<string> = []
    const requestId = "unexpected-request-42"
    const dependencyError =
      "postgresql://operator:fake-secret@database.internal/coin_archive"
    const app = createApp({
      allowedOrigins: ["https://coin-archive.example"],
      checkReadiness: successfulReadinessCheck,
      log: (line) => lines.push(line),
    })
    app.get("/unexpected", () => {
      throw new Error(dependencyError, {
        cause: new Error("request-cause-sentinel"),
      })
    })

    const notFound = await app.request("/unknown")
    const unexpected = await app.request("/unexpected", {
      headers: { "x-request-id": requestId },
    })
    const events = lines.map((line) => JSON.parse(line))
    const requestFailure = events.find(
      (event) => event.event === "request_failed"
    )

    expect(notFound.status).toBe(404)
    await expect(notFound.json()).resolves.toEqual({
      error: { code: "not_found", message: "Not found" },
    })
    expect(unexpected.status).toBe(500)
    await expect(unexpected.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
    expect(unexpected.headers.get("x-request-id")).toBe(requestId)
    expect(lines.join("\n")).not.toContain(dependencyError)
    expect(lines.join("\n")).not.toContain("request-cause-sentinel")
    expect(requestFailure).toMatchObject({
      level: "error",
      event: "request_failed",
      requestId,
    })
    expect(requestFailure?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(requestFailure).not.toHaveProperty("error")
    expect(requestFailure).not.toHaveProperty("message")
    expect(requestFailure).not.toHaveProperty("cause")
    expect(requestFailure).not.toHaveProperty("stack")
  })

  it("registers the complete API contract exactly once", async () => {
    const response = await createApp({
      allowedOrigins: [],
      checkReadiness: successfulReadinessCheck,
    }).request("/openapi.json")
    const document = (await response.json()) as {
      components: { schemas: Record<string, unknown> }
      paths: Record<string, unknown>
    }

    expect(Object.keys(document.paths).sort()).toEqual([
      "/health",
      "/ready",
      "/v1/coins",
      "/v1/coins/{coinId}",
      "/v1/currencies",
      "/v1/distributions",
      "/v1/engravers",
      "/v1/issuers",
      "/v1/mints",
      "/v1/rulers",
    ])
    expect(Object.keys(document.components.schemas).sort()).toEqual([
      "Coin",
      "CoinListItem",
      "CoinListResponse",
      "CoinNotFoundError",
      "CoinPathParameters",
      "Currency",
      "CurrencyListResponse",
      "Distribution",
      "DistributionListResponse",
      "EngraverListResponse",
      "FaceValue",
      "HealthResponse",
      "InternalError",
      "InvalidCoinIdError",
      "InvalidDistributionError",
      "InvalidEngraverSlugError",
      "InvalidFaceValueFilterError",
      "InvalidIssuerCodeError",
      "InvalidMintSlugError",
      "InvalidPaginationError",
      "InvalidRulingAuthoritySlugError",
      "InvalidYearError",
      "Issuer",
      "IssuerListResponse",
      "Mint",
      "MintListResponse",
      "RulingAuthorityListResponse",
      "UnavailableResponse",
    ])
  })

  it("applies global middleware across operational and Coin routes", async () => {
    const app = createApp({
      allowedOrigins: ["https://coin-archive.example"],
      checkReadiness: successfulReadinessCheck,
    })
    const headers = {
      origin: "https://coin-archive.example",
      "x-request-id": "cross-route-request-42",
    }

    for (const path of ["/health", "/v1/coins"]) {
      const response = await app.request(path, { headers })

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(response.headers.get("x-request-id")).toBe(
        "cross-route-request-42"
      )
      expect(response.headers.get("access-control-allow-origin")).toBe(
        "https://coin-archive.example"
      )
    }
  })

  it("emits one structured JSON request log", async () => {
    const lines: Array<string> = []
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
      log: (line) => lines.push(line),
    })

    await app.request("/health", {
      headers: { "x-request-id": "test-request-42" },
    })

    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({
      level: "info",
      requestId: "test-request-42",
      method: "GET",
      path: "/health",
      status: 200,
    })
    expect(JSON.parse(lines[0] ?? "").timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(JSON.parse(lines[0] ?? "").durationMs).toBeGreaterThanOrEqual(0)
  })
})
