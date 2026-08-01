import "@tanstack/react-start/server-only"

type Environment = Record<string, string | undefined>

export type RuntimeEnvironment = {
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
  "DATABASE_URL",
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
    r2: {
      endpoint: values.R2_ENDPOINT!,
      bucket: values.R2_BUCKET!,
      accessKeyId: values.R2_ACCESS_KEY_ID!,
      secretAccessKey: values.R2_SECRET_ACCESS_KEY!,
      publicBaseUrl: values.R2_PUBLIC_BASE_URL!,
    },
  }
}
