import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { afterAll, beforeEach } from "vitest"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinFace } from "../schema/coin-face"
import { coinFaceEngraver } from "../schema/coin-face-engraver"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinTheme } from "../schema/coin-theme"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { shape } from "../schema/shape"
import { technique } from "../schema/technique"
import { theme } from "../schema/theme"

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
  await database.delete(coinFaceEngraver)
  await database.delete(coinTheme)
  await database.delete(coinMint)
  await database.delete(coinRuler)
  await database.delete(coinFace)
  await database.delete(coin)
  await database.delete(mint)
  await database.delete(ruler)
  await database.delete(rulerGroup)
  await database.delete(catalogue)
  await database.delete(issuer)
  await database.delete(orientation)
  await database.delete(rim)
  await database.delete(shape)
  await database.delete(technique)
  await database.delete(theme)
  await database.delete(edge)
  await database.delete(distribution)
  await database.delete(currency)
  await database.delete(composition)
}

export function useTestDatabaseIsolation(database: TestDatabase) {
  beforeEach(async () => {
    await clearTestData(database)
  })

  afterAll(async () => {
    await clearTestData(database)
  })
}
