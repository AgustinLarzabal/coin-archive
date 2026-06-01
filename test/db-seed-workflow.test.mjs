import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);
const dbPackageDir = "packages/db";
const dbSeedFiles = {
  packageJson: `${dbPackageDir}/package.json`,
  index: `${dbPackageDir}/src/index.ts`,
  seedData: `${dbPackageDir}/src/seed-data.ts`,
  seed: `${dbPackageDir}/src/seed.ts`,
};

async function readTextFile(path) {
  return readFile(new URL(path, rootDir), "utf8");
}

test("database package exposes a deterministic internal Coin seed workflow", async () => {
  const [
    packageJsonText,
    dbPackageJsonText,
    dbIndexText,
    seedDataText,
    seedText,
  ] = await Promise.all([
    readTextFile("package.json"),
    readTextFile(dbSeedFiles.packageJson),
    readTextFile(dbSeedFiles.index),
    readTextFile(dbSeedFiles.seedData),
    readTextFile(dbSeedFiles.seed),
  ]);

  const packageJson = JSON.parse(packageJsonText);
  const dbPackageJson = JSON.parse(dbPackageJsonText);

  assert.equal(packageJson.scripts["db:seed"], "pnpm --filter @workspace/db run seed");
  assert.equal(dbPackageJson.scripts.seed, "node --import tsx ./src/seed.ts");
  assert.ok(dbPackageJson.devDependencies?.tsx);

  assert.match(seedDataText, /export const seededCoins = \[/);
  assert.match(seedDataText, /title: "Seed Coin 01"/);
  assert.match(seedDataText, /title: "Seed Coin 10"/);
  assert.match(seedDataText, /createdAt: new Date\("2026-01-01T00:00:00\.000Z"\)/);
  assert.match(seedDataText, /createdAt: new Date\("2026-01-10T00:00:00\.000Z"\)/);
  assert.match(seedDataText, /updatedAt: new Date\("2026-01-01T00:00:00\.000Z"\)/);
  assert.match(seedDataText, /updatedAt: new Date\("2026-01-10T00:00:00\.000Z"\)/);

  const titleMatches = [...seedDataText.matchAll(/title: "([^"]+)"/g)];
  const seededTitles = titleMatches.map((match) => match[1]);

  assert.equal(seededTitles.length, 10);
  assert.equal(new Set(seededTitles).size, 10);
  for (const title of seededTitles) {
    assert.ok(title.length <= 255);
  }

  assert.match(seedText, /import \{ inArray \} from "drizzle-orm";/);
  assert.match(seedText, /import \{ db \} from "\.\/client";/);
  assert.match(seedText, /import \{ coin \} from "\.\/schema\/coin";/);
  assert.match(seedText, /import \{ seededCoins \} from "\.\/seed-data";/);
  assert.match(seedText, /await db\.delete\(coin\)\.where\(inArray\(coin\.title,\s*seededCoins\.map\(\(\{ title \}\) => title\)\)\);/);
  assert.match(seedText, /await db\.insert\(coin\)\.values\(seededCoins\);/);
  assert.match(seedText, /void seedCoins\(\);/);
  assert.doesNotMatch(seedText, /process\.argv|seedCount|batch/i);

  assert.doesNotMatch(dbIndexText, /seed/i);
  assert.doesNotMatch(dbIndexText, /createCoin/i);
});
