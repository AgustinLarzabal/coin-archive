const requiredSettingNames = [
  "API_ENVIRONMENT",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_TRUSTED_ORIGINS",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "R2_ACCESS_KEY_ID",
  "R2_BUCKET",
  "R2_ENDPOINT",
  "R2_SECRET_ACCESS_KEY",
  "SURFACE_IMAGE_ORIGIN",
] as const

type RequiredSettingName = (typeof requiredSettingNames)[number]
type Environment = Partial<Record<RequiredSettingName, unknown>>

export type RuntimeEnvironment = {
  apiEnvironment: "staging" | "production"
  betterAuthSecret: string
  betterAuthTrustedOrigins: string
  betterAuthUrl: string
  databaseUrl: string
  googleClientId: string
  googleClientSecret: string
  r2AccessKeyId: string
  r2Bucket: string
  r2Endpoint: string
  r2SecretAccessKey: string
  surfaceImageOrigin: string
}

export function parseRuntimeEnvironment(
  environment: Environment
): RuntimeEnvironment {
  const values = Object.fromEntries(
    requiredSettingNames.map((name) => [
      name,
      typeof environment[name] === "string" ? environment[name] : undefined,
    ])
  ) as Record<RequiredSettingName, string | undefined>
  const missingSettings = requiredSettingNames.filter(
    (name) => !values[name]?.trim()
  )

  if (missingSettings.length > 0) {
    throw new Error(
      `Missing required runtime configuration: ${missingSettings.join(", ")}.`
    )
  }

  if (
    values.API_ENVIRONMENT !== "staging" &&
    values.API_ENVIRONMENT !== "production"
  ) {
    throw new Error(
      'Invalid API_ENVIRONMENT: expected "staging" or "production".'
    )
  }

  return {
    apiEnvironment: values.API_ENVIRONMENT,
    betterAuthSecret: values.BETTER_AUTH_SECRET!,
    betterAuthTrustedOrigins: values.BETTER_AUTH_TRUSTED_ORIGINS!,
    betterAuthUrl: values.BETTER_AUTH_URL!,
    databaseUrl: values.DATABASE_URL!,
    googleClientId: values.GOOGLE_CLIENT_ID!,
    googleClientSecret: values.GOOGLE_CLIENT_SECRET!,
    r2AccessKeyId: values.R2_ACCESS_KEY_ID!,
    r2Bucket: values.R2_BUCKET!,
    r2Endpoint: values.R2_ENDPOINT!,
    r2SecretAccessKey: values.R2_SECRET_ACCESS_KEY!,
    surfaceImageOrigin: values.SURFACE_IMAGE_ORIGIN!,
  }
}
