import "@tanstack/react-start/server-only"

type Environment = Record<string, string | undefined>

export type RuntimeEnvironment = {
  auth: {
    betterAuthSecret: string
    betterAuthUrl: string
    googleClientId: string
    googleClientSecret: string
  }
  databaseUrl: string
  r2: {
    accessKeyId: string
    bucket: string
    endpoint: string
    publicBaseUrl: string
    secretAccessKey: string
  }
}

const requiredSettingNames = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "R2_ACCESS_KEY_ID",
  "R2_BUCKET",
  "R2_ENDPOINT",
  "R2_PUBLIC_BASE_URL",
  "R2_SECRET_ACCESS_KEY",
] as const

export function getRuntimeEnvironment(
  environment: Environment = process.env
): RuntimeEnvironment {
  const values = Object.fromEntries(
    requiredSettingNames.map((name) => [name, environment[name]?.trim()])
  ) as Record<(typeof requiredSettingNames)[number], string | undefined>
  const missingSettings = requiredSettingNames.filter((name) => !values[name])

  if (missingSettings.length > 0) {
    throw new Error(
      `Missing required runtime configuration: ${missingSettings.join(", ")}.`
    )
  }

  return {
    databaseUrl: values.DATABASE_URL!,
    auth: {
      betterAuthSecret: values.BETTER_AUTH_SECRET!,
      betterAuthUrl: values.BETTER_AUTH_URL!,
      googleClientId: values.GOOGLE_CLIENT_ID!,
      googleClientSecret: values.GOOGLE_CLIENT_SECRET!,
    },
    r2: {
      endpoint: values.R2_ENDPOINT!,
      bucket: values.R2_BUCKET!,
      accessKeyId: values.R2_ACCESS_KEY_ID!,
      secretAccessKey: values.R2_SECRET_ACCESS_KEY!,
      publicBaseUrl: values.R2_PUBLIC_BASE_URL!,
    },
  }
}
