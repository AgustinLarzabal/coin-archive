import { spawnSync } from "node:child_process";
import postgres from "postgres";
import { getDatabaseTestUrl } from "../env";

function getDatabaseName(databaseUrl: string) {
  return new URL(databaseUrl).pathname.slice(1);
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function ensureTestDatabaseExists(databaseUrl: string) {
  const databaseName = getDatabaseName(databaseUrl);
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const client = postgres(adminUrl.toString(), {
    prepare: false,
    max: 1,
  });

  try {
    const [{ exists }] = await client<{ exists: boolean }[]>`
      select exists(
        select 1
        from pg_database
        where datname = ${databaseName}
      ) as "exists"
    `;

    if (!exists) {
      await client.unsafe(`create database ${quoteIdentifier(databaseName)}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Unable to prepare the test database. Run npm run db:start first. ${message}`
    );
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = getDatabaseTestUrl();
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };

  await ensureTestDatabaseExists(databaseUrl);
  runCommand("pnpm", ["exec", "drizzle-kit", "migrate"], env);
  runCommand(
    "pnpm",
    ["exec", "vitest", "run", "--config", "vitest.integration.config.ts"],
    env
  );
}

void main();
