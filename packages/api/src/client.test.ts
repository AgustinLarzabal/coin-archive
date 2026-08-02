import { describe, expect, it } from "vitest"
import { createMaintenanceApiClient, createPublicApiClient } from "./client"

describe("createPublicApiClient", () => {
  it("uses the supplied base URL and fetch implementation for Coin browsing", async () => {
    let requestedUrl = ""
    const client = createPublicApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (input) => {
        requestedUrl = input instanceof Request ? input.url : String(input)
        return new Response(JSON.stringify({ data: [], nextCursor: null }), {
          headers: { "Content-Type": "application/json" },
        })
      },
    })

    await client.coins.browse({ issuer: "spain", limit: 30 })

    expect(requestedUrl).toBe(
      "https://api.example.test/api/v1/coins?issuer=spain&limit=30"
    )
  })

  it("uses the supplied base URL and fetch implementation for Coin detail", async () => {
    let requestedUrl = ""
    const client = createPublicApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (input) => {
        requestedUrl = input instanceof Request ? input.url : String(input)
        return new Response(JSON.stringify({ data: {} }), {
          headers: { "Content-Type": "application/json" },
        })
      },
    })

    await client.coins.detail({
      uuid: "018f1a11-aaaa-7000-8000-000000000001",
    })

    expect(requestedUrl).toBe(
      "https://api.example.test/api/v1/coins/018f1a11-aaaa-7000-8000-000000000001"
    )
  })
})

describe("createMaintenanceApiClient", () => {
  it("uses the protected Orientation collection and detail routes", async () => {
    const requestedUrls: string[] = []
    const client = createMaintenanceApiClient({
      baseUrl: "https://coinarchive.app",
      fetch: async (input) => {
        requestedUrls.push(input instanceof Request ? input.url : String(input))
        const url = input instanceof Request ? input.url : String(input)

        return Response.json(
          url.endsWith("/options")
            ? { data: [], nextCursor: null }
            : url.includes("018f1a11-aaaa-7000-8000-000000000001")
              ? {
                  data: {
                    id: "018f1a11-aaaa-7000-8000-000000000001",
                    code: "coin-alignment",
                    name: "Coin alignment",
                    version: 1,
                    createdAt: "2026-08-02T10:15:30.000Z",
                    updatedAt: "2026-08-02T10:15:30.000Z",
                  },
                }
              : { data: [], nextCursor: null }
        )
      },
    })

    await client.orientations.list({ limit: 30, sort: "name" })
    await client.orientations.options({ q: "coin" })
    await client.orientations.detail({
      uuid: "018f1a11-aaaa-7000-8000-000000000001",
    })

    expect(requestedUrls).toStrictEqual([
      "https://coinarchive.app/api/v1/maintenance/orientations?limit=30&sort=name",
      "https://coinarchive.app/api/v1/maintenance/orientations/options?q=coin",
      "https://coinarchive.app/api/v1/maintenance/orientations/018f1a11-aaaa-7000-8000-000000000001",
    ])
  })

  it("preserves Orientation mutation headers and statuses", async () => {
    const requests: Request[] = []
    const client = createMaintenanceApiClient({
      baseUrl: "https://coinarchive.app",
      fetch: async (input) => {
        const request = input instanceof Request ? input : new Request(input)
        requests.push(request)
        const orientation = {
          id: "018f1a11-aaaa-7000-8000-000000000001",
          code: "coin-alignment",
          name: "Coin alignment",
          version: request.method === "PUT" ? 2 : 1,
          createdAt: "2026-08-02T10:15:30.000Z",
          updatedAt: "2026-08-02T10:15:30.000Z",
          etag: request.method === "PUT" ? '"version-2"' : '"version-1"',
        }
        if (request.method === "DELETE") {
          return new Response(null, { status: 204 })
        }
        return Response.json(
          { data: orientation },
          {
            status: request.method === "POST" ? 201 : 200,
            headers: {
              ETag: orientation.etag,
              Location: `/api/v1/maintenance/orientations/${orientation.id}`,
            },
          }
        )
      },
    })
    const uuid = "018f1a11-aaaa-7000-8000-000000000001"

    const created = await client.orientations.create({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "coin-alignment", name: "Coin alignment" },
    })
    const replaced = await client.orientations.replace({
      params: { uuid },
      headers: { "if-match": '"version-1"' },
      body: { code: "coin-alignment", name: "Coin alignment" },
    })
    const deleted = await client.orientations.delete({
      params: { uuid },
      headers: { "if-match": '"version-2"' },
    })

    expect(created).toMatchObject({
      status: 201,
      headers: { etag: '"version-1"' },
    })
    expect(replaced).toMatchObject({
      status: 200,
      headers: { etag: '"version-2"' },
    })
    expect(deleted).toStrictEqual({ status: 204, headers: {}, body: undefined })
    expect(requests.map((request) => request.method)).toStrictEqual([
      "POST",
      "PUT",
      "DELETE",
    ])
    expect(requests[0].headers.get("idempotency-key")).toBe("attempt-1")
    expect(requests[1].headers.get("if-match")).toBe('"version-1"')
    expect(requests[2].headers.get("if-match")).toBe('"version-2"')
  })

  it("retains RFC 9457 problem bodies on typed mutation errors", async () => {
    const client = createMaintenanceApiClient({
      baseUrl: "https://coinarchive.app",
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: "https://api.coinarchive.app/problems/orientation-code-conflict",
            title: "Orientation Code already exists",
            status: 409,
            detail: "Another Orientation already uses this Orientation Code",
            instance: "/api/v1/maintenance/orientations",
            code: "orientation_code_conflict",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    })

    await expect(
      client.orientations.create({
        headers: { "idempotency-key": "attempt-1" },
        body: { code: "coin-alignment", name: "Coin alignment" },
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      data: { body: { code: "orientation_code_conflict" } },
    })
  })
})
