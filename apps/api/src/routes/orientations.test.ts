import { expect, it } from "vitest"
import { createApp } from "../app.js"

it("lists Coin Orientations from the database catalogue", async () => {
  const response = await createApp({
    allowedOrigins: [],
    checkReadiness: async () => {},
    listOrientations: async () => [
      {
        id: "00000000-0000-4000-8000-000000000001",
        slug: "diagonal",
        name: "Diagonal",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }).request("/v1/orientations")
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    orientations: [{ slug: "diagonal", name: "Diagonal" }],
  })
})
