import { createDatabase } from "@coin-archive/db"
import { expect, it } from "vitest"

import worker from "./worker.js"

it("serves Coin list, detail, and reference data through a binding caller", async () => {
  const databaseUrl = process.env.DATABASE_URL!
  const database = createDatabase(databaseUrl)
  const slug = `worker-test-${crypto.randomUUID()}`
  const issuerCode = `T${crypto.randomUUID().slice(0, 7).toUpperCase()}`
  let issuerId: string | undefined
  let distributionId: string | undefined
  let coinId: string | undefined
  try {
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({
          slug: `issuer-${slug}`,
          name: "Worker Test Issuer",
          code: issuerCode,
        })
        .returning()
      issuerId = issuer.id
      const [distribution] = await database.orm
        .insert(database.schema.distributions)
        .values({
          slug: `distribution-${slug}`,
          name: `Worker test distribution ${slug}`,
        })
        .returning()
      distributionId = distribution.id
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          slug,
          title: "Worker Test Coin",
          issuerId,
          distributionId,
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
      IMAGE_BASE_URL: "https://mica-images.coinarchive.app",
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
          expect.objectContaining({
            code: issuerCode,
            name: "Worker Test Issuer",
          }),
        ]),
      })
    )
  } finally {
    const cleanup = createDatabase(databaseUrl)
    try {
      if (coinId) {
        await cleanup.orm.$client.query("DELETE FROM coins WHERE id = $1", [
          coinId,
        ])
      }
      if (distributionId) {
        await cleanup.orm.$client.query(
          "DELETE FROM distributions WHERE id = $1",
          [distributionId]
        )
      }
      if (issuerId) {
        await cleanup.orm.$client.query("DELETE FROM issuers WHERE id = $1", [
          issuerId,
        ])
      }
      if (coinId) {
        const { rows } = await cleanup.orm.$client.query(
          "SELECT id FROM coins WHERE id = $1",
          [coinId]
        )
        expect(rows).toEqual([])
      }
      if (distributionId) {
        const { rows } = await cleanup.orm.$client.query(
          "SELECT id FROM distributions WHERE id = $1",
          [distributionId]
        )
        expect(rows).toEqual([])
      }
      if (issuerId) {
        const { rows } = await cleanup.orm.$client.query(
          "SELECT id FROM issuers WHERE id = $1",
          [issuerId]
        )
        expect(rows).toEqual([])
      }
    } finally {
      await cleanup.close()
    }
  }
})
