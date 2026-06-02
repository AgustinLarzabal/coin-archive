import assert from "node:assert/strict";
import test from "node:test";
import { withGetCoinsQuerySql } from "./get-coins-query-test-helpers";

test("getCoins can filter by issuer code including descendant issuers", async () => {
  await withGetCoinsQuerySql({ issuerCode: "argentina" }, ({ sql, params }) => {
    assert.match(sql, /where\s+"coin"\."issuer_id"\s+in\s+\(\s+with recursive issuer_tree/i);
    assert.match(sql, /where "issuer"\."code" = \$1/i);
    assert.match(sql, /from "issuer" as "child_issuer"/i);
    assert.match(sql, /"child_issuer"\."parent_issuer_id" = issuer_tree\.id/i);
    assert.match(sql, /order by "coin"\."created_at" desc, "coin"\."id" desc/i);
    assert.deepEqual(params, ["argentina", 10]);
  });
});
