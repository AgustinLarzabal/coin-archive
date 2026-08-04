import "@tanstack/react-start/server-only"

type Environment = Record<string, string | undefined>

export type RuntimeEnvironment = {
  databaseUrl: string
}

const requiredSettingNames = ["DATABASE_URL"] as const

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
  }
}
