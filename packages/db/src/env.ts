import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { loadEnvFile } from "node:process"
import { fileURLToPath } from "node:url"

const rootEnvPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.env"
)

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath)
}

export function getDatabaseUrl() {
  return getRequiredEnvironmentVariable(
    "DATABASE_URL",
    "DATABASE_URL is required"
  )
}

export function getDatabaseTestUrl() {
  return getRequiredEnvironmentVariable(
    "DATABASE_TEST_URL",
    "DATABASE_TEST_URL is required for PostgreSQL integration tests"
  )
}

function getRequiredEnvironmentVariable(
  name: "DATABASE_URL" | "DATABASE_TEST_URL",
  errorMessage: string
) {
  const value = process.env[name]

  if (!value) {
    throw new Error(errorMessage)
  }

  return value
}
