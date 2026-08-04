import { describe, expect, it } from "vitest"

import { createApiApp } from "./app"

type OpenApiOperation = {
  parameters?: Array<{ in: string; name: string; required?: boolean }>
  responses: Record<
    string,
    {
      content?: Record<string, { schema?: unknown }>
      headers?: Record<string, unknown>
    }
  >
  security: Array<Record<string, never[]>>
  tags: string[]
}

type OpenApiDocument = {
  components: {
    securitySchemes: Record<string, unknown>
  }
  info: { title: string; version: string }
  openapi: string
  paths: Record<string, Record<string, OpenApiOperation>>
}

const lookupResources = [
  ["catalogues", "Catalogue Maintenance"],
  ["compositions", "Composition Maintenance"],
  ["currencies", "Currency Maintenance"],
  ["distributions", "Distribution Maintenance"],
  ["edges", "Edge Maintenance"],
  ["rims", "Rim Maintenance"],
  ["shapes", "Shape Maintenance"],
  ["minting-techniques", "Minting Technique Maintenance"],
  ["engravers", "Engraver Maintenance"],
  ["themes", "Theme Maintenance"],
  ["issuers", "Issuer Maintenance"],
  ["rulers", "Ruler Maintenance"],
  ["ruler-groups", "Ruler Group Maintenance"],
  ["orientations", "Orientation Maintenance"],
  ["mints", "Mint Maintenance"],
] as const

function createApp() {
  return createApiApp({
    environment: "production",
    surfaceImageOrigin: "https://images.coinarchive.app",
    browseCoins: async () => [],
  })
}

function parameter(operation: OpenApiOperation, name: string) {
  return operation.parameters?.find((candidate) => candidate.name === name)
}

describe("generated OpenAPI document", () => {
  it("contains the complete tagged public and maintenance API", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document = await response.json<OpenApiDocument>()

    expect(document).toMatchObject({
      openapi: expect.stringMatching(/^3\./),
      info: { title: "Coin Archive API", version: "1.0.0" },
      components: {
        securitySchemes: { collectorSession: expect.any(Object) },
      },
    })

    for (const path of ["/api/v1/coins", "/api/v1/coins/{uuid}"]) {
      expect(document.paths[path].get).toMatchObject({
        tags: ["Coins"],
        security: [],
      })
    }

    for (const [resource, tag] of lookupResources) {
      const collection = document.paths[`/api/v1/maintenance/${resource}`]
      const detail = document.paths[`/api/v1/maintenance/${resource}/{uuid}`]
      const options = document.paths[`/api/v1/maintenance/${resource}/options`]

      for (const operation of [
        collection.get,
        collection.post,
        detail.get,
        detail.put,
        detail.delete,
        options.get,
      ]) {
        expect(operation).toMatchObject({
          tags: [tag],
          security: [{ collectorSession: [] }],
        })
      }
    }

    const extraMaintenanceOperations = [
      document.paths["/api/v1/maintenance/overview"].get,
      document.paths["/api/v1/maintenance/coins"].get,
      document.paths["/api/v1/maintenance/coins"].post,
      document.paths["/api/v1/maintenance/coins/options"].get,
      document.paths["/api/v1/maintenance/coins/{uuid}"].get,
      document.paths["/api/v1/maintenance/coins/{uuid}"].put,
      document.paths["/api/v1/maintenance/coins/{uuid}"].delete,
      document.paths["/api/v1/maintenance/coins/{uuid}/deletion-summary"].get,
      document.paths["/api/v1/maintenance/surface-image-uploads"].post,
      document.paths["/api/v1/maintenance/surface-image-uploads"].delete,
    ]
    for (const operation of extraMaintenanceOperations) {
      expect(operation.security).toStrictEqual([{ collectorSession: [] }])
      expect(operation.tags).toHaveLength(1)
    }
  })

  it("documents required transport headers, success schemas, and RFC 9457 problems", async () => {
    const response = await createApp().request(
      "https://api.coinarchive.app/api/v1/openapi.json"
    )
    const document = await response.json<OpenApiDocument>()
    const protectedOperations = Object.entries(document.paths)
      .filter(([path]) => path.startsWith("/api/v1/maintenance/"))
      .flatMap(([, pathItem]) => Object.values(pathItem))

    for (const operation of protectedOperations) {
      expect(operation.responses["401"].content).toHaveProperty(
        "application/problem+json"
      )
      expect(operation.responses["403"].content).toHaveProperty(
        "application/problem+json"
      )
      expect(operation.responses["429"].content).toHaveProperty(
        "application/problem+json"
      )
    }

    for (const [resource] of lookupResources) {
      const collection = document.paths[`/api/v1/maintenance/${resource}`]
      const detail = document.paths[`/api/v1/maintenance/${resource}/{uuid}`]

      expect(parameter(collection.post, "idempotency-key")).toMatchObject({
        in: "header",
        required: true,
      })
      expect(collection.post.responses["201"]).toMatchObject({
        headers: { etag: expect.any(Object), location: expect.any(Object) },
        content: { "application/json": { schema: expect.any(Object) } },
      })
      for (const operation of [detail.put, detail.delete]) {
        expect(parameter(operation, "if-match")).toMatchObject({
          in: "header",
          required: true,
        })
      }
      expect(detail.put.responses["200"].headers).toHaveProperty("etag")
      expect(detail.delete.responses).toHaveProperty("204")
    }
  })
})
