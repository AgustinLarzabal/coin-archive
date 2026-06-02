import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}
