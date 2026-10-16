import { describe, expect, it } from "vitest"

import { createApp } from "../app.js"

const baseOptions = {
  allowedOrigins: [],
  checkReadiness: async () => {},
  log: () => {},
}

describe("GET /v1/rulers", () => {
  it("returns every Ruling Authority as Slug and name in repository order", async () => {
    const response = await createApp({
      ...baseOptions,
      listRulingAuthorities: async () => [
        {
          id: "10000000-0000-4000-8000-000000000002",
          slug: "first-name",
          name: "First Name",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "10000000-0000-4000-8000-000000000001",
          slug: "shared-name-a",
          name: "Shared Name",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "10000000-0000-4000-8000-000000000003",
          slug: "shared-name-b",
          name: "Shared Name",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    }).request("/v1/rulers")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      rulers: [
        { slug: "first-name", name: "First Name" },
        { slug: "shared-name-a", name: "Shared Name" },
        { slug: "shared-name-b", name: "Shared Name" },
      ],
    })
  })

  it("documents authority discovery", async () => {
    const response = await createApp(baseOptions).request("/openapi.json")
    const document = (await response.json()) as {
      paths: Record<string, { get: { responses: Record<string, unknown> } }>
    }

    expect(document.paths["/v1/rulers"].get.responses["200"]).toBeDefined()
  })
})
