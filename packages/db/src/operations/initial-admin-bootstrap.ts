import { pathToFileURL } from "node:url"

import { closeDb } from "../client"
import { bootstrapInitialAdmin } from "../mutations/bootstrap-initial-admin"

function isExecutedDirectly() {
  const entrypointPath = process.argv.at(1)

  return (
    entrypointPath !== undefined &&
    import.meta.url === pathToFileURL(entrypointPath).href
  )
}

if (isExecutedDirectly()) {
  try {
    const result = await bootstrapInitialAdmin({
      configuredEmail: process.env.INITIAL_ADMIN_EMAIL,
    })

    if (result.status !== "promoted") {
      throw new Error(`Initial Admin bootstrap refused: ${result.status}`)
    }

    console.log(`Promoted ${result.email} to Admin.`)
  } finally {
    await closeDb()
  }
}
