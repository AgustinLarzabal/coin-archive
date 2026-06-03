import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

export function createDatabaseClient(databaseUrl: string) {
  return postgres(databaseUrl, {
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
