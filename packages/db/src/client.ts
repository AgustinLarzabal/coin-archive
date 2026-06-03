import { createDatabase } from "./database"
import { getDatabaseUrl } from "./env"

const databaseUrl = getDatabaseUrl()
const { client, db } = createDatabase(databaseUrl)

export { db }

export function closeDb() {
  return client.end()
}
