import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const successfulReadinessCheck = async () => {}

describe("Engraver routes", () => {
  describe("GET /v1/engravers", () => {
    it("returns exactly each canonical Engraver's public Slug and full name", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listEngravers: async () => [
          {
            id: "30000000-0000-4000-8000-000000000001",
            slug: "first-engraver",
            fullName: "First Engraver",
            createdAt: new Date("2026-09-16T09:00:00.000Z"),
            updatedAt: new Date("2026-09-17T09:00:00.000Z"),
          },
        ],
      }).request("/v1/engravers")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      })
    })

    it("keeps Engraver list failures safe and uncacheable", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listEngravers: async () => {
          throw new Error("postgresql://operator:secret@database.internal")
        },
      }).request("/v1/engravers")

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents the public Engraver list response", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        paths: {
          "/v1/engravers": { get: { responses: Record<string, unknown> } }
        }
      }

      expect(document.paths["/v1/engravers"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EngraverListResponse" },
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
