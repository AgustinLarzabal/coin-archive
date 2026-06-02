import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { buildGetCoinsQuery } from "../src/queries/get-coins";

function createQuery(options: Parameters<typeof buildGetCoinsQuery>[1]) {
  const sqlClient = postgres("postgresql://coin_archive:coin_archive@localhost:5432/coin_archive", {
    prepare: false,
  });
  const db = drizzle(sqlClient);
  const query = buildGetCoinsQuery(db, options);
  const querySql = query.toSQL();

  return {
    ...querySql,
    end: () => sqlClient.end({ timeout: 0 }),
  };
}

test("getCoins applies descendant-inclusive issuer filtering for child issuers", async () => {
  const query = createQuery({ issuerCode: "buenos-aires", limit: 2 });

  await query.end();

  assert.match(query.sql, /where\s+"coin"\."issuer_id"\s+in\s+\(\s+with recursive issuer_tree/i);
  assert.match(query.sql, /where "issuer"\."code" = \$1/i);
  assert.match(query.sql, /from "issuer" as "child_issuer"/i);
  assert.match(query.sql, /"child_issuer"\."parent_issuer_id" = issuer_tree\.id/i);
  assert.match(query.sql, /order by "coin"\."created_at" desc, "coin"\."id" desc/i);
  assert.deepEqual(query.params, ["buenos-aires", 2]);
});

test("getCoins treats an empty issuer code as a filter instead of returning the unfiltered recent list", async () => {
  const query = createQuery({ issuerCode: "" });

  await query.end();

  assert.match(query.sql, /where\s+"coin"\."issuer_id"\s+in\s+\(\s+with recursive issuer_tree/i);
  assert.deepEqual(query.params, ["", 10]);
});
