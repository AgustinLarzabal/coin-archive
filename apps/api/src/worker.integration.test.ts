import { createDatabase } from "@coin-archive/db"
import { expect, it } from "vitest"

import worker from "./worker.js"

it("serves Coin list, detail, and reference data through a binding caller", async () => {
  const databaseUrl = process.env.DATABASE_URL!
  const database = createDatabase(databaseUrl)
  const slug = `worker-test-${crypto.randomUUID()}`
  const issuerCode = `T${crypto.randomUUID().slice(0, 7).toUpperCase()}`
  let coinId: string
  try {
    const [issuer] = await database.orm
      .insert(database.schema.issuers)
      .values({
        slug: `issuer-${slug}`,
        name: "Worker Test Issuer",
        code: issuerCode,
      })
      .returning()
    const [distribution] = await database.orm
      .insert(database.schema.distributions)
      .values({
        slug: `distribution-${slug}`,
        name: `Worker test distribution ${slug}`,
      })
      .returning()
    const [coin] = await database.orm
      .insert(database.schema.coins)
      .values({
        slug,
        title: "Worker Test Coin",
        issuerId: issuer.id,
        distributionId: distribution.id,
        firstIssueYear: 2020,
        lastIssueYear: 2020,
      })
      .returning()
    coinId = coin.id
  } finally {
    await database.close()
  }

  const env = {
    HYPERDRIVE: { connectionString: databaseUrl },
    IMAGE_BASE_URL: "https://images.example.com",
    API_DATABASE_CONNECTION_TIMEOUT_MS: "5000",
    API_DATABASE_STATEMENT_TIMEOUT_MS: "10000",
  } as Env
  const binding = {
    fetch: (path: string) =>
      worker.fetch(new Request(`https://api.internal${path}`), env),
  }

  const [list, detail, issuers] = await Promise.all([
    binding.fetch(`/v1/coins?issuer=${issuerCode}`),
    binding.fetch(`/v1/coins/${coinId}`),
    binding.fetch("/v1/issuers"),
  ])

  expect(list.status).toBe(200)
  expect(await list.json()).toEqual(
    expect.objectContaining({
      coins: [
        expect.objectContaining({
          id: coinId,
          slug,
          title: "Worker Test Coin",
        }),
      ],
    })
  )
  expect(detail.status).toBe(200)
  expect(await detail.json()).toEqual(
    expect.objectContaining({ id: coinId, slug, title: "Worker Test Coin" })
  )
  expect(issuers.status).toBe(200)
  expect(await issuers.json()).toEqual(
    expect.objectContaining({
      issuers: expect.arrayContaining([
        expect.objectContaining({ code: issuerCode, name: "Worker Test Issuer" }),
      ]),
    })
  )
})
