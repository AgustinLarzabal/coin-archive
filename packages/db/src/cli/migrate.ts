import { migrate } from "drizzle-orm/node-postgres/migrator"

import { createDatabase } from "../connection.js"
import { resolveDatabaseUrl } from "../database-url.js"

const databaseUrl = resolveDatabaseUrl(process.env)

const database = createDatabase(databaseUrl, { connectionTimeoutMillis: 30_000 })

try {
  await migrate(database.orm, { migrationsFolder: "drizzle" })
} finally {
  await database.close()
}
