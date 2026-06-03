import { getDatabaseTestUrl } from "../env"

const testDatabaseNamePattern = /(?:^test$|^test[-_]|[-_]test$|[-_]test[-_])/i

export function getDatabaseName(databaseUrl: string) {
  const url = new URL(databaseUrl)
  const databaseName = decodeURIComponent(url.pathname.slice(1))

  if (!databaseName) {
    throw new Error("PostgreSQL database URL must include a database name")
  }

  return databaseName
}

export function assertSafeDatabaseTestUrl(databaseUrl: string) {
  const databaseName = getDatabaseName(databaseUrl)

  if (!testDatabaseNamePattern.test(databaseName)) {
    throw new Error(
      `DATABASE_TEST_URL must point to a dedicated test database. Received database "${databaseName}".`
    )
  }
}

export function requireSafeDatabaseTestUrl() {
  const databaseUrl = getDatabaseTestUrl()

  assertSafeDatabaseTestUrl(databaseUrl)

  return databaseUrl
}

export function getMaintenanceDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl)

  url.pathname = "/postgres"

  return url.toString()
}
