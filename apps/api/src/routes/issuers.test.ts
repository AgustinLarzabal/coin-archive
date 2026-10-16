import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const successfulReadinessCheck = async () => {}

describe("Issuer routes", () => {
  describe("GET /v1/issuers", () => {
    const issuers = [
      {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Argentina",
        code: "AR",
        createdAt: new Date("2026-09-16T09:00:00.000Z"),
        updatedAt: new Date("2026-09-16T09:00:00.000Z"),
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        name: "Roman Empire",
        code: "ROMAN",
        createdAt: new Date("2026-09-17T09:00:00.000Z"),
        updatedAt: new Date("2026-09-17T09:00:00.000Z"),
      },
    ]

    it("returns only each persisted Issuer's public name and Issuer Code", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listIssuers: async () => issuers,
      }).request("/v1/issuers")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        issuers: [
          { name: "Argentina", code: "AR" },
          { name: "Roman Empire", code: "ROMAN" },
        ],
      })
    })

    it("keeps Issuer collection failures safe and uncacheable", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listIssuers: async () => {
          throw new Error("postgresql://operator:secret@database.internal")
        },
      }).request("/v1/issuers")

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents the public Issuer collection response", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        paths: {
          "/v1/issuers": { get: { responses: Record<string, unknown> } }
        }
      }

      expect(document.paths["/v1/issuers"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IssuerListResponse" },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
    })
  })
})
