import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { coin } from "../schema/coin";
import { issuer } from "../schema/issuer";

type TestDatabase = ReturnType<typeof drizzle>;

export function createTestDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,
  });

  return {
    client,
    db: drizzle(client),
  };
}

export async function clearTestData(database: TestDatabase) {
  await database.delete(coin);
  await database.delete(issuer);
}
