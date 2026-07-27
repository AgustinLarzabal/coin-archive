loadLocalEnvironmentFile()

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

export function loadLocalEnvironmentFile(
  loadEnvironmentFile:
    | typeof process.loadEnvFile
    | undefined = process.loadEnvFile
) {
  if (loadEnvironmentFile === undefined) {
    return
  }

  try {
    loadEnvironmentFile(new URL("../../../.env", import.meta.url))
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOENT")
    ) {
      throw error
    }
  }
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
