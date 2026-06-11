import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

export function createDatabaseClient(databaseUrl: string) {
  return postgres(databaseUrl, {
    connection: {
      // This catalog app issues wide, low-row-count queries. PostgreSQL JIT adds
      // over a second of compilation overhead here while saving almost no
      // execution time, so disable it for these sessions.
      jit: "off",
    },
    prepare: false,
  })
}

export function createDatabase(databaseUrl: string) {
  const client = createDatabaseClient(databaseUrl)

  return {
    client,
    db: drizzle(client),
  }
}
