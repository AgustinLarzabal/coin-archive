import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";

const databaseUrl = getDatabaseUrl();

const client = postgres(databaseUrl, {
  prepare: false,
});

export const db = drizzle(client);

export function closeDb() {
  return client.end();
}
