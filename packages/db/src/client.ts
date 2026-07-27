import { createDatabase } from "./database"
import { getDatabaseUrl } from "./env"

type Database = ReturnType<typeof createDatabase>["db"]
type DatabaseInstance = ReturnType<typeof createDatabase>

function isCloudflareWorkerRuntime() {
  return "WebSocketPair" in globalThis
}

export function createDatabaseAccessor(
  create = createDatabase,
  getUrl = getDatabaseUrl,
  isWorkerRuntime = isCloudflareWorkerRuntime
) {
  let database: DatabaseInstance | undefined
  let configuredDatabaseUrl: string | undefined

  return {
    close() {
      return database?.client.end()
    },
    get() {
      const databaseUrl = getUrl()

      if (isWorkerRuntime()) {
        return create(databaseUrl)
      }

      if (database === undefined || configuredDatabaseUrl !== databaseUrl) {
        database = create(databaseUrl)
        configuredDatabaseUrl = databaseUrl
      }

      return database
    },
  }
}

const databaseAccessor = createDatabaseAccessor()

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const database = databaseAccessor.get().db
    const value = Reflect.get(database, property, receiver)

    return typeof value === "function" ? value.bind(database) : value
  },
})

export function closeDb() {
  return databaseAccessor.close()
}
