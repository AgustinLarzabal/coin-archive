import { createDatabase } from "@coin-archive/db"

import { createDatabaseApp } from "./app.js"
import { loadConfig } from "./config.js"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = loadConfig({
      API_ALLOWED_ORIGINS: "",
      API_DATABASE_CONNECTION_TIMEOUT_MS:
        env.API_DATABASE_CONNECTION_TIMEOUT_MS,
      API_DATABASE_STATEMENT_TIMEOUT_MS: env.API_DATABASE_STATEMENT_TIMEOUT_MS,
      DATABASE_URL: env.HYPERDRIVE.connectionString,
      IMAGE_BASE_URL: env.IMAGE_BASE_URL,
    })
    const database = createDatabase(config.databaseUrl, {
      connectionTimeoutMillis: config.databaseConnectionTimeoutMillis,
      onPoolError: () =>
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "error",
            event: "database_pool_error",
          })
        ),
      statementTimeoutMillis: config.databaseStatementTimeoutMillis,
    })

    try {
      return await createDatabaseApp(database, config).fetch(request)
    } finally {
      await database.close()
    }
  },
}
