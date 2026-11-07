import { describe, expect, it } from "vitest"
import { createApp } from "../app.js"

const options = { allowedOrigins: [], checkReadiness: async () => {} }

describe("GET /v1/compositions", () => {
  it("returns public slugs and current names", async () => {
    const response = await createApp({
      ...options,
      listCompositions: async () => [
        {
          id: "00000000-0000-4000-8000-000000000001",
          slug: "bimetallic",
          name: "Two metals",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }).request("/v1/compositions")
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      compositions: [{ slug: "bimetallic", name: "Two metals" }],
    })
  })

  it("documents the catalogue and returns a safe database error", async () => {
    const document = await createApp(options).request("/openapi.json")
    const spec = (await document.json()) as { paths: Record<string, unknown> }
    expect(spec.paths).toHaveProperty("/v1/compositions")
    const response = await createApp({
      ...options,
      listCompositions: async () => {
        throw new Error("secret")
      },
    }).request("/v1/compositions")
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
  })
})
