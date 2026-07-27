loadLocalEnvironmentFile()

type AuthEnvironmentVariableName =
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"

export type AuthEnvironment = {
  betterAuthSecret: string
  betterAuthUrl: string
  googleClientId: string
  googleClientSecret: string
}

export function getAuthEnvironment(): AuthEnvironment {
  return {
    betterAuthSecret: getRequiredEnvironmentVariable(
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_SECRET is required"
    ),
    betterAuthUrl: getRequiredEnvironmentVariable(
      "BETTER_AUTH_URL",
      "BETTER_AUTH_URL is required"
    ),
    googleClientId: getRequiredEnvironmentVariable(
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_ID is required"
    ),
    googleClientSecret: getRequiredEnvironmentVariable(
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET is required"
    ),
  }
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
  name: AuthEnvironmentVariableName,
  errorMessage: string
) {
  const value = process.env[name]

  if (!value) {
    throw new Error(errorMessage)
  }

  return value
}
