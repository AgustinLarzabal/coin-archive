import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);

async function readTextFile(path) {
  return readFile(new URL(path, rootDir), "utf8");
}

test("web root route renders the returned Coin array as plain JSON", async () => {
  const [routeText, renderCoinJsonText] = await Promise.all([
    readTextFile("apps/web/src/routes/index.tsx"),
    readTextFile("apps/web/src/routes/render-coin-json.ts"),
  ]);

  assert.match(routeText, /import \{ renderCoinJson \} from "\.\/render-coin-json"/);
  assert.match(routeText, /const coins = Route\.useLoaderData\(\)/);
  assert.match(routeText, /<pre>\{renderCoinJson\(coins\)\}<\/pre>/);
  assert.doesNotMatch(routeText, /JSON\.stringify\(coins,\s*null,\s*2\)/);

  assert.match(
    renderCoinJsonText,
    /export function renderCoinJson\(coins: unknown\) \{\s*return JSON\.stringify\(coins,\s*null,\s*2\)\s*\}/,
  );
  assert.equal(JSON.stringify([], null, 2), "[]");
  assert.equal(
    JSON.stringify([{ id: "coin-1", title: "Test Coin" }], null, 2),
    '[\n  {\n    "id": "coin-1",\n    "title": "Test Coin"\n  }\n]',
  );
});
