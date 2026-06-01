import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootDir = new URL("../", import.meta.url);

async function readTextFile(path) {
  return readFile(new URL(path, rootDir), "utf8");
}

test("web root route consumes the named Recent Coin query", async () => {
  const [webPackageJsonText, routeText] = await Promise.all([
    readTextFile("apps/web/package.json"),
    readTextFile("apps/web/src/routes/index.tsx"),
  ]);

  const webPackageJson = JSON.parse(webPackageJsonText);

  assert.equal(webPackageJson.dependencies["@workspace/db"], "workspace:*");
  assert.match(routeText, /import \{ createFileRoute \} from "@tanstack\/react-router"/);
  assert.match(routeText, /import \{ getCoins \} from "@workspace\/db"/);
  assert.match(routeText, /createFileRoute\("\/"\)\(\{\s*loader: \(\) => getCoins\(\),/s);
  assert.match(routeText, /const coins = Route\.useLoaderData\(\)/);
  assert.match(routeText, /JSON\.stringify\(coins,\s*null,\s*2\)/);
  assert.doesNotMatch(routeText, /db\./);
  assert.doesNotMatch(routeText, /drizzle/i);
});
