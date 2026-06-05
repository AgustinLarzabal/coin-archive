import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { afterAll, beforeEach } from "vitest"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { distribution } from "../schema/distribution"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"

type TestDatabase = ReturnType<typeof drizzle>

export function createTestDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,
  })

  return {
    client,
    db: drizzle(client),
  }
}

export async function clearTestData(database: TestDatabase) {
  await database.delete(coinReference)
  await database.delete(coinRuler)
  await database.delete(coin)
  await database.delete(ruler)
  await database.delete(rulerGroup)
  await database.delete(catalogue)
  await database.delete(issuer)
  await database.delete(distribution)
}

export function useTestDatabaseIsolation(database: TestDatabase) {
  beforeEach(async () => {
    await clearTestData(database)
  })

  afterAll(async () => {
    await clearTestData(database)
  })
}
