const integrationDatabaseUrl =
  "postgresql://coin_archive_test@127.0.0.1:5433/coin_archive_test"

export function assertIntegrationDatabaseUrl(databaseUrl: string | undefined) {
  if (databaseUrl !== integrationDatabaseUrl) {
    throw new Error("Integration tests require the dedicated local database. Run pnpm test:db.")
  }
}
