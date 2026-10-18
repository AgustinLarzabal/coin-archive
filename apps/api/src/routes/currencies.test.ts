import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const successfulReadinessCheck = async () => {}

describe("GET /v1/currencies", () => {
  const currencies = [
    {
      id: "50000000-0000-4000-8000-000000000001",
      slug: "argentine-peso-convertible",
      name: "Peso",
      periodLabel: "1992–2001",
      createdAt: new Date("2026-09-16T09:00:00.000Z"),
      updatedAt: new Date("2026-09-16T09:00:00.000Z"),
    },
  ]

  it("returns only each Currency's public identity and derived Full Name", async () => {
    const response = await createApp({
      allowedOrigins: [],
      checkReadiness: successfulReadinessCheck,
      listCurrencies: async () => currencies,
    }).request("/v1/currencies")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      currencies: [
        {
          slug: "argentine-peso-convertible",
          name: "Peso",
          fullName: "Peso (1992–2001)",
        },
      ],
    })
  })

  it("keeps Currency listing failures safe and uncacheable", async () => {
    const response = await createApp({
      allowedOrigins: [],
      checkReadiness: successfulReadinessCheck,
      listCurrencies: async () => {
        throw new Error("database secret")
      },
    }).request("/v1/currencies")

    expect(response.status).toBe(500)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
  })

  it("documents the Currency catalogue", async () => {
    const response = await createApp({
      allowedOrigins: [],
      checkReadiness: successfulReadinessCheck,
    }).request("/openapi.json")
    const document = (await response.json()) as {
      paths: Record<string, { get: { responses: Record<string, unknown> } }>
    }

    expect(document.paths["/v1/currencies"].get.responses).toEqual(
      expect.objectContaining({
        "200": expect.any(Object),
        "500": expect.any(Object),
      })
    )
  })
})
