import { expect, it } from "vitest"
import { createApp } from "../app.js"

it("lists current Shapes from the database catalogue", async () => {
  const response = await createApp({
    allowedOrigins: [],
    checkReadiness: async () => {},
    listShapes: async () => [
      {
        id: "00000000-0000-4000-8000-000000000001",
        slug: "pentagonal",
        name: "Pentagonal",
      },
    ],
  }).request("/v1/shapes")
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    shapes: [{ slug: "pentagonal", name: "Pentagonal" }],
  })
})
