import { describe, expect, it } from "vitest"
import { createApp } from "../app.js"

const options = { allowedOrigins: [], checkReadiness: async () => {} }

describe("GET /v1/distributions", () => {
  it("publishes every Distribution with only its slug and name", async () => {
    const response = await createApp({
      ...options,
      listDistributions: async () => [
        {
          id: "00000000-0000-4000-8000-000000000001",
          slug: "unused-pattern",
          name: "Pattern",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }).request("/v1/distributions")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      distributions: [{ slug: "unused-pattern", name: "Pattern" }],
    })
  })

  it("returns the standard safe error on database failure", async () => {
    const response = await createApp({
      ...options,
      listDistributions: async () => {
        throw new Error("database secret")
      },
    }).request("/v1/distributions")
    expect(response.status).toBe(500)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
  })

  it("documents the public response and failure", async () => {
    const response = await createApp(options).request("/openapi.json")
    const document = (await response.json()) as {
      paths: Record<string, { get: { responses: Record<string, unknown> } }>
      components: { schemas: Record<string, unknown> }
    }
    expect(document.paths["/v1/distributions"].get.responses).toEqual(
      expect.objectContaining({
        "200": expect.any(Object),
        "500": expect.any(Object),
      })
    )
    expect(document.components.schemas).toHaveProperty("Distribution")
    expect(document.components.schemas).toHaveProperty(
      "DistributionListResponse"
    )
  })
})
