import { pathToFileURL } from "node:url"

import { closeDb } from "../client"
import { resetAndSeedDatabase } from "./reset-and-seed-database"

type StagingResetWorkflow = {
  environment: string | undefined
  githubActions: string | undefined
  workflowName: string | undefined
}

export function requireStagingResetWorkflow({
  environment,
  githubActions,
  workflowName,
}: StagingResetWorkflow) {
  if (environment !== "staging") {
    throw new Error(
      "COIN_ARCHIVE_ENVIRONMENT must be staging to reset and reseed a database"
    )
  }

  if (githubActions !== "true" || workflowName !== "Reset staging data") {
    throw new Error(
      "Reset and reseed is available only from the Reset staging data workflow"
    )
  }
}

export async function resetAndSeedStagingDatabase(
  workflow: StagingResetWorkflow
) {
  requireStagingResetWorkflow(workflow)
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
      githubActions: process.env.GITHUB_ACTIONS,
      workflowName: process.env.GITHUB_WORKFLOW,
    })
    console.log("Staging database reset and reseeded with generated demo data.")
  } finally {
    await closeDb()
  }
}
