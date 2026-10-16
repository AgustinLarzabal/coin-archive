import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const successfulReadinessCheck = async () => {}

describe("Operational routes", () => {
  it("reports liveness without external dependencies", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/health")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("prevents liveness responses from being cached", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/health")

    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("reports readiness after the injected dependency succeeds", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: async () => {},
    }).request("/ready")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("reports safe unavailability while liveness remains healthy", async () => {
    const lines: Array<string> = []
    const requestId = "readiness-request-42"
    const dependencyError =
      "postgresql://operator:fake-secret@database.internal/coin_archive"
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: async () => {
        throw new Error(dependencyError, {
          cause: new Error("readiness-cause-sentinel"),
        })
      },
      log: (line) => lines.push(line),
    })

    const readiness = await app.request("/ready", {
      headers: { "x-request-id": requestId },
    })
    const liveness = await app.request("/health")
    const readinessBody = await readiness.json()
    const events = lines.map((line) => JSON.parse(line))
    const readinessFailure = events.find(
      (event) => event.event === "readiness_check_failed"
    )

    expect(readiness.status).toBe(503)
    expect(readiness.headers.get("cache-control")).toBe("no-store")
    expect(readinessBody).toEqual({ status: "unavailable" })
    expect(JSON.stringify(readinessBody)).not.toContain(dependencyError)
    expect(lines.join("\n")).not.toContain(dependencyError)
    expect(lines.join("\n")).not.toContain("readiness-cause-sentinel")
    expect(readinessFailure).toMatchObject({
      level: "error",
      event: "readiness_check_failed",
      requestId,
    })
    expect(readinessFailure?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(readinessFailure).not.toHaveProperty("error")
    expect(readinessFailure).not.toHaveProperty("message")
    expect(readinessFailure).not.toHaveProperty("cause")
    expect(readinessFailure).not.toHaveProperty("stack")
    expect(liveness.status).toBe(200)
    await expect(liveness.json()).resolves.toEqual({ status: "ok" })
  })

  it("serves a generated OpenAPI contract for operational endpoints", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/openapi.json")
    const document = (await response.json()) as {
      components: {
        schemas: {
          HealthResponse: unknown
          UnavailableResponse: unknown
        }
      }
      openapi: string
      paths: {
        "/health": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": { schema: unknown }
                }
                headers: Record<string, unknown>
              }
            }
          }
        }
        "/ready": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": { schema: unknown }
                }
              }
              "503": {
                content: {
                  "application/json": { schema: unknown }
                }
              }
            }
          }
        }
      }
    }

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(document.openapi).toBe("3.1.0")
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/ready")
    expect(document.paths["/ready"].get.responses).toEqual(
      expect.objectContaining({
        "200": expect.any(Object),
        "503": expect.any(Object),
      })
    )
    expect(document.paths["/health"].get.responses["200"].headers).toEqual(
      expect.objectContaining({
        "Cache-Control": expect.any(Object),
        "x-request-id": expect.any(Object),
      })
    )
    expect(document.components.schemas.HealthResponse).toEqual({
      type: "object",
      properties: { status: { type: "string", enum: ["ok"] } },
      required: ["status"],
      additionalProperties: false,
    })
    expect(document.components.schemas.UnavailableResponse).toEqual({
      type: "object",
      properties: { status: { type: "string", enum: ["unavailable"] } },
      required: ["status"],
      additionalProperties: false,
    })
    expect(
      document.paths["/health"].get.responses["200"].content["application/json"]
        .schema
    ).toEqual({ $ref: "#/components/schemas/HealthResponse" })
    expect(
      document.paths["/ready"].get.responses["200"].content["application/json"]
        .schema
    ).toEqual({ $ref: "#/components/schemas/HealthResponse" })
    expect(
      document.paths["/ready"].get.responses["503"].content["application/json"]
        .schema
    ).toEqual({ $ref: "#/components/schemas/UnavailableResponse" })
  })
})
