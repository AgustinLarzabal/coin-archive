import assert from "node:assert/strict";
import test from "node:test";
import { withGetCoinsQuerySql } from "./get-coins-query-test-helpers";

test("getCoins applies descendant-inclusive issuer filtering for child issuers", async () => {
  await withGetCoinsQuerySql({ issuerCode: "buenos-aires", limit: 2 }, ({ sql, params }) => {
    assert.match(sql, /where\s+"coin"\."issuer_id"\s+in\s+\(\s+with recursive issuer_tree/i);
    assert.match(sql, /where "issuer"\."code" = \$1/i);
    assert.match(sql, /from "issuer" as "child_issuer"/i);
    assert.match(sql, /"child_issuer"\."parent_issuer_id" = issuer_tree\.id/i);
    assert.match(sql, /order by "coin"\."created_at" desc, "coin"\."id" desc/i);
    assert.deepEqual(params, ["buenos-aires", 2]);
  });
});

test("getCoins treats an empty issuer code as a filter instead of returning the unfiltered recent list", async () => {
  await withGetCoinsQuerySql({ issuerCode: "" }, ({ sql, params }) => {
    assert.match(sql, /where\s+"coin"\."issuer_id"\s+in\s+\(\s+with recursive issuer_tree/i);
    assert.deepEqual(params, ["", 10]);
  });
});
