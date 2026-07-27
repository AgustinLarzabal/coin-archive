import { createDatabase } from "./database"
import { getDatabaseUrl } from "./env"

type Database = ReturnType<typeof createDatabase>["db"]

let database: ReturnType<typeof createDatabase> | undefined
let configuredDatabaseUrl: string | undefined

function getDatabase() {
  const databaseUrl = getDatabaseUrl()

  if (database === undefined || configuredDatabaseUrl !== databaseUrl) {
    database = createDatabase(databaseUrl)
    configuredDatabaseUrl = databaseUrl
  }

  return database
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDatabase().db, property, receiver)

    return typeof value === "function" ? value.bind(getDatabase().db) : value
  },
})

export function closeDb() {
  return database?.client.end()
}
