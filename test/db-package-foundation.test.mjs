import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);

async function readTextFile(path) {
  return readFile(new URL(path, rootDir), "utf8");
}

test("database package owns Drizzle foundation for Coin records", async () => {
  const [
    packageJsonText,
    dbPackageJsonText,
    dbTsconfigText,
    drizzleConfigText,
    schemaText,
    clientText,
    indexText,
    migrationSqlText,
    adrText,
  ] = await Promise.all([
    readTextFile("package.json"),
    readTextFile("packages/db/package.json"),
    readTextFile("packages/db/tsconfig.json"),
    readTextFile("packages/db/drizzle.config.ts"),
    readTextFile("packages/db/src/schema/coin.ts"),
    readTextFile("packages/db/src/client.ts"),
    readTextFile("packages/db/src/index.ts"),
    readTextFile("packages/db/migration/0000_initial_coin.sql"),
    readTextFile("docs/adr/0001-postgresql-drizzle-db-package.md"),
  ]);

  const packageJson = JSON.parse(packageJsonText);
  const dbPackageJson = JSON.parse(dbPackageJsonText);
  const dbTsconfig = JSON.parse(dbTsconfigText);

  assert.equal(dbPackageJson.name, "@workspace/db");
  assert.equal(dbPackageJson.type, "module");
  assert.equal(dbPackageJson.private, true);
  assert.ok(dbPackageJson.dependencies["drizzle-orm"]);
  assert.ok(dbPackageJson.dependencies["postgres"]);
  assert.ok(packageJson.devDependencies["drizzle-kit"]);

  assert.match(
    drizzleConfigText,
    /schema:\s*"\.\/src\/schema\/\*\.ts"/,
  );
  assert.match(drizzleConfigText, /out:\s*"\.\/migration"/);
  assert.match(drizzleConfigText, /dialect:\s*"postgresql"/);
  assert.match(drizzleConfigText, /dbCredentials:\s*\{\s*url:\s*process\.env\.DATABASE_URL/);

  assert.equal(dbTsconfig.compilerOptions.composite, true);
  assert.equal(dbTsconfig.compilerOptions.declaration, true);
  assert.equal(dbTsconfig.compilerOptions.emitDeclarationOnly, true);
  assert.equal(dbTsconfig.compilerOptions.noEmit, false);
  assert.equal(dbTsconfig.compilerOptions.outDir, "./dist");
  assert.equal(dbTsconfig.compilerOptions.rootDir, "./src");
  assert.deepEqual(dbTsconfig.compilerOptions.types, ["node"]);

  assert.match(clientText, /const databaseUrl = process\.env\.DATABASE_URL;/);
  assert.match(clientText, /if \(!databaseUrl\) \{\s*throw new Error\("DATABASE_URL is required"\);\s*\}/);
  assert.match(clientText, /const client = postgres\(databaseUrl/);
  assert.match(clientText, /export const db = drizzle\(client/);

  assert.match(schemaText, /pgTable\("coin"/);
  assert.match(schemaText, /id:\s*uuid\("id"\)\.primaryKey\(\)\.default\(sql`uuidv7\(\)`\)/);
  assert.match(schemaText, /title:\s*varchar\("title",\s*\{\s*length:\s*255\s*\}\)\.notNull\(\)/);
  assert.match(
    schemaText,
    /createdAt:\s*timestamp\("created_at",\s*\{\s*withTimezone:\s*true,\s*mode:\s*"date",\s*\}\)\s*\.notNull\(\)\s*\.defaultNow\(\)/,
  );
  assert.match(
    schemaText,
    /updatedAt:\s*timestamp\("updated_at",\s*\{\s*withTimezone:\s*true,\s*mode:\s*"date",\s*\}\)\s*\.notNull\(\)\s*\.defaultNow\(\)/,
  );
  assert.match(
    schemaText,
    /index\("coin_recent_created_at_id_idx"\)\.on\(\s*coin\.createdAt\.desc\(\),\s*coin\.id\.desc\(\),?\s*\)/,
  );
  assert.doesNotMatch(schemaText, /trigger/i);

  assert.match(indexText, /export \{ db \} from "\.\/client";/);
  assert.match(indexText, /export \{ coin \} from "\.\/schema\/coin";/);
  assert.match(indexText, /export type Coin = typeof coin\.\$inferSelect;/);

  assert.match(migrationSqlText, /create extension if not exists pgcrypto;/i);
  assert.match(migrationSqlText, /create table .*"coin"/i);
  assert.match(migrationSqlText, /"id"\s+uuid\s+primary key\s+default uuidv7\(\)/i);
  assert.match(migrationSqlText, /"title"\s+varchar\(255\)\s+not null/i);
  assert.match(migrationSqlText, /"created_at".*default now\(\)/i);
  assert.match(migrationSqlText, /"updated_at".*default now\(\)/i);
  assert.match(migrationSqlText, /create index .*coin_recent_created_at_id_idx.*"created_at" desc,.*"id" desc/i);

  assert.match(adrText, /PostgreSQL 18/i);
  assert.match(adrText, /UUIDv7/i);
});
