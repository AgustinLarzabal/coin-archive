import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const options = { allowedOrigins: [], checkReadiness: async () => {} }

describe("GET /v1/mints", () => {
  it("publishes each Mint with its country and operation period", async () => {
    const response = await createApp({
      ...options,
      listMints: async () => [
        {
          id: "40000000-0000-4000-8000-000000000001",
          slug: "rome-italy",
          name: "Rome Mint",
          place: "Rome",
          countryId: "10000000-0000-4000-8000-000000000001",
          country: {
            id: "10000000-0000-4000-8000-000000000001",
            code: "IT",
            name: "Italy",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          startYear: 1900,
          endYear: null,
          operating: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }).request("/v1/mints")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      mints: [
        {
          id: "40000000-0000-4000-8000-000000000001",
          slug: "rome-italy",
          name: "Rome Mint",
          place: "Rome",
          country: { code: "IT", name: "Italy" },
          startYear: 1900,
          endYear: null,
          operating: true,
        },
      ],
    })
  })

  it("returns an empty catalogue and a safe database error", async () => {
    const empty = await createApp(options).request("/v1/mints")
    expect(empty.status).toBe(200)
    await expect(empty.json()).resolves.toEqual({ mints: [] })

    const failure = await createApp({
      ...options,
      listMints: async () => {
        throw new Error("database secret")
      },
    }).request("/v1/mints")
    expect(failure.status).toBe(500)
    await expect(failure.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
  })

  it("documents the Mint catalogue", async () => {
    const response = await createApp(options).request("/openapi.json")
    const document = (await response.json()) as {
      paths: Record<string, { get: { responses: Record<string, unknown> } }>
      components: { schemas: Record<string, unknown> }
    }
    expect(document.paths["/v1/mints"].get.responses).toEqual(
      expect.objectContaining({
        "200": expect.any(Object),
        "500": expect.any(Object),
      })
    )
    expect(document.components.schemas).toHaveProperty("Mint")
    expect(document.components.schemas).toHaveProperty("MintListResponse")
  })
})
