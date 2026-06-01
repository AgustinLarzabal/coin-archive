import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);
const databaseName = "coin_archive";
const databaseUser = "coin_archive";
const databasePassword = "coin_archive";
const databaseUrl = `postgresql://${databaseUser}:${databasePassword}@localhost:5432/${databaseName}`;
const dbScripts = {
  "db:start": "docker compose up -d --wait postgres",
  "db:stop": "docker compose stop postgres",
  "db:reset": "docker compose down --volumes",
};

async function readTextFile(path) {
  return readFile(new URL(path, rootDir), "utf8");
}

test("workspace exposes local PostgreSQL infrastructure", async () => {
  const [packageJsonText, composeText, envExampleText] = await Promise.all([
    readTextFile("package.json"),
    readTextFile("compose.yaml"),
    readTextFile(".env.example"),
  ]);

  const packageJson = JSON.parse(packageJsonText);

  assert.deepEqual(
    {
      "db:start": packageJson.scripts["db:start"],
      "db:stop": packageJson.scripts["db:stop"],
      "db:reset": packageJson.scripts["db:reset"],
    },
    dbScripts,
  );

  assert.match(composeText, /^services:\n  postgres:\n/m);
  assert.match(composeText, /image:\s*postgres:18\b/);
  assert.match(composeText, new RegExp(`POSTGRES_DB:\\s*${databaseName}\\b`));
  assert.match(composeText, new RegExp(`POSTGRES_USER:\\s*${databaseUser}\\b`));
  assert.match(
    composeText,
    new RegExp(`POSTGRES_PASSWORD:\\s*${databasePassword}\\b`),
  );
  assert.match(
    composeText,
    new RegExp(
      `healthcheck:\\n(?:    .*\\n)*\\s*test:\\s*\\["CMD-SHELL",\\s*"pg_isready -U ${databaseUser} -d ${databaseName}"\\]`,
      "m",
    ),
  );

  assert.match(envExampleText, new RegExp(`^DATABASE_URL=${databaseUrl}$`, "m"));
});
