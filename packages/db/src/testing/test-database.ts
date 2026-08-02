import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { afterAll, beforeEach } from "vitest"

import { databaseSchema } from "../database"
import { account } from "../schema/account"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinTheme } from "../schema/coin-theme"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { session } from "../schema/session"
import { shape } from "../schema/shape"
import { surfaceImageCleanupFailure } from "../schema/surface-image-cleanup-failure"
import { technique } from "../schema/technique"
import { theme } from "../schema/theme"
import { user } from "../schema/user"
import { verification } from "../schema/verification"

type TestDatabase = ReturnType<typeof createTestDatabase>["db"]

export function createTestDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,
  })

  return {
    client,
    db: drizzle(client, {
      schema: databaseSchema,
    }),
  }
}

export async function clearTestData(database: TestDatabase) {
  await database.delete(maintenanceIdempotency)
  await database.delete(account)
  await database.delete(session)
  await database.delete(verification)
  await database.delete(coinSurfaceEngraver)
  await database.delete(surfaceImageCleanupFailure)
  await database.delete(coinReference)
  await database.delete(coinTheme)
  await database.delete(coinMint)
  await database.delete(coinRuler)
  await database.delete(coinSurface)
  await database.delete(coin)
  await database.delete(ruler)
  await database.delete(rulerGroup)
  await database.delete(catalogue)
  await database.delete(composition)
  await database.delete(currency)
  await database.delete(distribution)
  await database.delete(edge)
  await database.delete(engraver)
  await database.delete(issuer)
  await database.delete(mint)
  await database.delete(orientation)
  await database.delete(rim)
  await database.delete(shape)
  await database.delete(technique)
  await database.delete(theme)
  await database.delete(user)
}

export function useTestDatabaseIsolation(database: TestDatabase) {
  beforeEach(async () => {
    await clearTestData(database)
  })

  afterAll(async () => {
    await clearTestData(database)
  })
}
