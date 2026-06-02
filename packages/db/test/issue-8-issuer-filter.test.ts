import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { buildGetCoinsQuery } from "../src/queries/get-coins";

test("getCoins can filter by issuer code including descendant issuers", async () => {
  const sqlClient = postgres("postgresql://coin_archive:coin_archive@localhost:5432/coin_archive", {
    prepare: false,
  });
  const db = drizzle(sqlClient);
  const query = buildGetCoinsQuery(db, { issuerCode: "argentina" });
  const { sql, params } = query.toSQL();

  await sqlClient.end({ timeout: 0 });

  assert.match(sql, /where\s+"coin"\."issuer_id"\s+in\s+\(\s+with recursive issuer_tree/i);
  assert.match(sql, /where "issuer"\."code" = \$1/i);
  assert.match(sql, /from "issuer" as "child_issuer"/i);
  assert.match(sql, /"child_issuer"\."parent_issuer_id" = issuer_tree\.id/i);
  assert.match(sql, /order by "coin"\."created_at" desc, "coin"\."id" desc/i);
  assert.deepEqual(params, ["argentina", 10]);
});
