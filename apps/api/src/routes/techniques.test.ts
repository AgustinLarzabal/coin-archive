import { expect, it } from "vitest"

import { createApp } from "../app.js"

it("lists ordered Techniques and an empty catalogue", async () => {
  const app = createApp({
    allowedOrigins: [],
    checkReadiness: async () => {},
    listTechniques: async () => [
      {
        id: "00000000-0000-4000-8000-000000000001",
        slug: "milled",
        name: "Milled",
      },
    ],
  })
  await expect((await app.request("/v1/techniques")).json()).resolves.toEqual({
    techniques: [{ slug: "milled", name: "Milled" }],
  })
  await expect(
    (
      await createApp({
        allowedOrigins: [],
        checkReadiness: async () => {},
        listTechniques: async () => [],
      }).request("/v1/techniques")
    ).json()
  ).resolves.toEqual({ techniques: [] })
  const openapi = (await (await app.request("/openapi.json")).json()) as {
    paths: Record<string, { get: { responses: Record<string, unknown> } }>
  }
  expect(openapi.paths["/v1/techniques"].get.responses["200"]).toBeDefined()
})
