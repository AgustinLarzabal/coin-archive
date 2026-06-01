import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);

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

  assert.equal(
    packageJson.scripts["db:start"],
    "docker compose up -d --wait postgres",
  );
  assert.equal(packageJson.scripts["db:stop"], "docker compose stop postgres");
  assert.equal(packageJson.scripts["db:reset"], "docker compose down --volumes");

  assert.match(composeText, /^services:\n  postgres:\n/m);
  assert.match(composeText, /image:\s*postgres:18\b/);
  assert.match(composeText, /POSTGRES_DB:\s*coin_archive\b/);
  assert.match(composeText, /POSTGRES_USER:\s*coin_archive\b/);
  assert.match(composeText, /POSTGRES_PASSWORD:\s*coin_archive\b/);
  assert.match(composeText, /healthcheck:\n(?:    .*\n)*\s*test:\s*\["CMD-SHELL",\s*"pg_isready -U coin_archive -d coin_archive"\]/m);

  assert.match(
    envExampleText,
    /^DATABASE_URL=postgresql:\/\/coin_archive:coin_archive@localhost:5432\/coin_archive$/m,
  );
});
