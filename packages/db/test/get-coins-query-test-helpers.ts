import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { buildGetCoinsQuery, type GetCoinsOptions } from "../src/queries/get-coins";

const testDatabaseUrl = "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive";

export async function withGetCoinsQuerySql(
  options: GetCoinsOptions,
  run: (querySql: ReturnType<ReturnType<typeof buildGetCoinsQuery>["toSQL"]>) => void | Promise<void>,
) {
  const sqlClient = postgres(testDatabaseUrl, { prepare: false });
  const db = drizzle(sqlClient);

  try {
    await run(buildGetCoinsQuery(db, options).toSQL());
  } finally {
    await sqlClient.end({ timeout: 0 });
  }
}
