import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { loadEnvFile } from "node:process"
import { fileURLToPath } from "node:url"

const rootEnvPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.env"
)
const testDatabaseNamePattern = /(^|[-_])test($|[-_])/

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath)
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

export function getDatabaseNameFromUrl(databaseUrl: string) {
  const databaseName = new URL(databaseUrl).pathname.slice(1)

  if (!databaseName) {
    throw new Error("Database URL must include a database name")
  }

  return databaseName
}

export function getDatabaseUrl() {
  return getRequiredEnv("DATABASE_URL")
}

export function getDatabaseTestUrl() {
  const databaseUrl = getRequiredEnv("DATABASE_TEST_URL")
  const databaseName = getDatabaseNameFromUrl(databaseUrl)

  if (!testDatabaseNamePattern.test(databaseName)) {
    throw new Error(
      `DATABASE_TEST_URL must point to a dedicated test database, received "${databaseName}"`
    )
  }

  return databaseUrl
}
