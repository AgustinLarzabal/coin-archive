import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);
const dbPackageDir = "packages/db";
const dbSeedFilePaths = {
  packageJson: `${dbPackageDir}/package.json`,
  index: `${dbPackageDir}/src/index.ts`,
  seedData: `${dbPackageDir}/src/seed-data.ts`,
  seed: `${dbPackageDir}/src/seed.ts`,
};
const rootSeedScript = "pnpm --filter @workspace/db run seed";
const dbSeedScript = "node --import tsx ./src/seed.ts";
const seedBoundaryDates = [
  "2026-01-01T00:00:00.000Z",
  "2026-01-10T00:00:00.000Z",
];
const seedFileImportPatterns = [
  /import \{ inArray \} from "drizzle-orm";/,
  /import \{ closeDb, db \} from "\.\/client";/,
  /import \{ coin \} from "\.\/schema\/coin";/,
  /import \{ seededCoins \} from "\.\/seed-data";/,
];

async function readTextFile(path) {
  return readFile(new URL(path, rootDir), "utf8");
}

function getSeededTitles(seedDataText) {
  return [...seedDataText.matchAll(/title: "([^"]+)"/g)].map((match) => match[1]);
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
    readTextFile(dbSeedFilePaths.packageJson),
    readTextFile(dbSeedFilePaths.index),
    readTextFile(dbSeedFilePaths.seedData),
    readTextFile(dbSeedFilePaths.seed),
  ]);

  const packageJson = JSON.parse(packageJsonText);
  const dbPackageJson = JSON.parse(dbPackageJsonText);

  assert.equal(packageJson.scripts["db:seed"], rootSeedScript);
  assert.equal(dbPackageJson.scripts.seed, dbSeedScript);
  assert.ok(dbPackageJson.devDependencies?.tsx);

  assert.match(seedDataText, /export const seededCoins = \[/);
  assert.match(seedDataText, /title: "Seed Coin 01"/);
  assert.match(seedDataText, /title: "Seed Coin 10"/);
  for (const isoDate of seedBoundaryDates) {
    const escapedIsoDate = isoDate.replaceAll(".", "\\.");
    assert.match(seedDataText, new RegExp(`createdAt: new Date\\("${escapedIsoDate}"\\)`));
    assert.match(seedDataText, new RegExp(`updatedAt: new Date\\("${escapedIsoDate}"\\)`));
  }

  const seededTitles = getSeededTitles(seedDataText);

  assert.equal(seededTitles.length, 10);
  assert.equal(new Set(seededTitles).size, 10);
  for (const title of seededTitles) {
    assert.ok(title.length <= 255);
  }

  for (const importPattern of seedFileImportPatterns) {
    assert.match(seedText, importPattern);
  }
  assert.match(seedText, /await db\.delete\(coin\)\.where\(inArray\(coin\.title,\s*seededCoins\.map\(\(\{ title \}\) => title\)\)\);/);
  assert.match(seedText, /await db\.insert\(coin\)\.values\(seededCoins\);/);
  assert.match(seedText, /await seedCoins\(\);/);
  assert.match(seedText, /await closeDb\(\);/);
  assert.doesNotMatch(seedText, /process\.argv|seedCount|batch/i);

  assert.doesNotMatch(dbIndexText, /seed/i);
  assert.doesNotMatch(dbIndexText, /createCoin/i);
});
