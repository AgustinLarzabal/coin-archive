import { describe, expect, it } from "vitest"
import { createApp } from "../app.js"

const options = { allowedOrigins: [], checkReadiness: async () => {} }

describe("GET /v1/tags", () => {
  it("returns public Tag slugs and names", async () => {
    const response = await createApp({
      ...options,
      listTags: async () => [
        {
          id: "00000000-0000-4000-8000-000000000001",
          slug: "map",
          name: "Map",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }).request("/v1/tags")
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      tags: [{ slug: "map", name: "Map" }],
    })
  })

  it("documents the catalogue and its failure response", async () => {
    const response = await createApp(options).request("/openapi.json")
    const document = (await response.json()) as {
      paths: Record<string, { get: { responses: Record<string, unknown> } }>
    }
    expect(document.paths["/v1/tags"].get.responses).toHaveProperty("200")
    expect(document.paths["/v1/tags"].get.responses).toHaveProperty("500")
  })
})
