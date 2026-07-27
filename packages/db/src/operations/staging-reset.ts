import { pathToFileURL } from "node:url"

import { closeDb } from "../client"
import { getDatabaseUrl } from "../env"
import { resetAndSeedDatabase } from "./reset-and-seed-database"

type StagingDatabaseTarget = {
  environment: string | undefined
  databaseUrl: string
  stagingDatabaseUrl: string | undefined
}

export function requireStagingDatabase({
  environment,
  databaseUrl,
  stagingDatabaseUrl,
}: StagingDatabaseTarget) {
  if (environment !== "staging") {
    throw new Error(
      "COIN_ARCHIVE_ENVIRONMENT must be staging to reset and reseed a database"
    )
  }

  if (!stagingDatabaseUrl || databaseUrl !== stagingDatabaseUrl) {
    throw new Error(
      "DATABASE_URL must match STAGING_DATABASE_URL to reset and reseed a database"
    )
  }
}

export async function resetAndSeedStagingDatabase(
  target: StagingDatabaseTarget
) {
  requireStagingDatabase(target)
  await resetAndSeedDatabase()
}

function isExecutedDirectly() {
  const entrypointPath = process.argv.at(1)

  return (
    entrypointPath !== undefined &&
    import.meta.url === pathToFileURL(entrypointPath).href
  )
}

if (isExecutedDirectly()) {
  try {
    await resetAndSeedStagingDatabase({
      environment: process.env.COIN_ARCHIVE_ENVIRONMENT,
      databaseUrl: getDatabaseUrl(),
      stagingDatabaseUrl: process.env.STAGING_DATABASE_URL,
    })
    console.log("Staging database reset and reseeded with generated demo data.")
  } finally {
    await closeDb()
  }
}
