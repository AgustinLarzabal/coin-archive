import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { createDatabase, createDatabaseClient } from "../database"
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
import { theme } from "../schema/theme"
import {
  getDatabaseName,
  getMaintenanceDatabaseUrl,
  requireSafeDatabaseTestUrl,
} from "./database-test-env"

const migrationsFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../migrations"
)
type DatabaseClient = ReturnType<typeof createDatabaseClient>

export function createTestDatabase() {
  return createDatabase(requireSafeDatabaseTestUrl())
}

export async function clearDatabaseTables(
  database: ReturnType<typeof createTestDatabase>["db"]
) {
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
  await database.delete(theme)
  await database.delete(edge)
  await database.delete(distribution)
  await database.delete(currency)
  await database.delete(composition)
}

export async function prepareDatabaseIntegrationTests() {
  const databaseUrl = requireSafeDatabaseTestUrl()

  await ensureDatabaseExists(databaseUrl)

  const { client, db } = createDatabase(databaseUrl)

  try {
    await migrate(db, { migrationsFolder })
  } catch (error) {
    await closeDatabaseClientQuietly(client)
    throw createMigrationFailureError(error)
  }

  await closeDatabaseClient(client)
}

async function ensureDatabaseExists(databaseUrl: string) {
  const client = createDatabaseClient(databaseUrl)

  try {
    await client`select 1`
    await closeDatabaseClient(client)
    return
  } catch (error) {
    await closeDatabaseClientQuietly(client)

    if (isMissingDatabaseError(error)) {
      await createMissingDatabase(databaseUrl)
      return
    }

    throw createDatabaseUnavailableError(error)
  }
}

async function createMissingDatabase(databaseUrl: string) {
  const maintenanceClient = createDatabaseClient(
    getMaintenanceDatabaseUrl(databaseUrl)
  )
  const databaseName = getDatabaseName(databaseUrl)

  try {
    await maintenanceClient.unsafe(
      `create database ${escapePostgresIdentifier(databaseName)}`
    )
  } catch (error) {
    await closeDatabaseClientQuietly(maintenanceClient)
    throw createDatabaseCreationError(databaseName, error)
  }

  await closeDatabaseClient(maintenanceClient)
}

function escapePostgresIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function closeDatabaseClient(client: DatabaseClient) {
  return client.end()
}

function closeDatabaseClientQuietly(client: DatabaseClient) {
  return closeDatabaseClient(client).catch(() => undefined)
}

function createMigrationFailureError(error: unknown) {
  return new Error(
    `Failed to apply database migrations for integration tests: ${formatDatabaseError(
      error
    )}`,
    { cause: error }
  )
}

function createDatabaseUnavailableError(error: unknown) {
  return new Error(
    `PostgreSQL is unavailable for integration tests. Start it explicitly with npm run db:start, then retry. ${formatDatabaseError(
      error
    )}`,
    { cause: error }
  )
}

function createDatabaseCreationError(databaseName: string, error: unknown) {
  return new Error(
    `Failed to create integration test database "${databaseName}": ${formatDatabaseError(
      error
    )}`,
    { cause: error }
  )
}

function isMissingDatabaseError(error: unknown) {
  return getPostgresErrorCode(error) === "3D000"
}

function getPostgresErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined
  }

  return typeof error.code === "string" ? error.code : undefined
}

function formatDatabaseError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message)
  }

  return String(error)
}
