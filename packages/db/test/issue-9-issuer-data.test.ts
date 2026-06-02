import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { buildGetCoinsQuery } from "../src/queries/get-coins";
import { coin } from "../src/schema/coin";
import { issuer } from "../src/schema/issuer";
import { seededCoins, seededIssuers } from "../src/seed/seed-data";

test("coin schema, query, migration, and seed data require issuers", async () => {
  assert.equal(coin.issuerId.notNull, true);
  assert.equal(issuer.code.notNull, true);
  assert.equal(issuer.parentIssuerId.notNull, false);

  const sqlClient = postgres("postgresql://coin_archive:coin_archive@localhost:5432/coin_archive", {
    prepare: false,
  });
  const db = drizzle(sqlClient);
  const query = buildGetCoinsQuery(db);
  const { sql, params } = query.toSQL();

  assert.match(sql, /from "coin"/i);
  assert.match(sql, /inner join "issuer"/i);
  assert.match(sql, /left join "issuer" "parent_issuer"/i);
  assert.match(sql, /order by "coin"\."created_at" desc, "coin"\."id" desc/i);
  assert.deepEqual(params, [10]);

  await sqlClient.end({ timeout: 0 });

  assert.ok(seededIssuers.some((seededIssuer) => seededIssuer.parentCode));
  assert.equal(seededCoins.length > 0, true);

  for (const seededCoin of seededCoins) {
    assert.equal(typeof seededCoin.issuerCode, "string");
    assert.ok(
      seededIssuers.some((seededIssuer) => seededIssuer.code === seededCoin.issuerCode),
      `Missing seeded issuer for ${seededCoin.title}`,
    );
  }

  const migrationSql = await readFile(
    resolve(import.meta.dirname, "../migrations/0001_add_issuers_to_coin_catalogue.sql"),
    "utf8",
  );

  assert.match(migrationSql, /create table "issuer"/i);
  assert.match(migrationSql, /"issuer_id" uuid not null/i);
  assert.match(migrationSql, /on delete restrict/i);
  assert.match(migrationSql, /constraint "issuer_parent_issuer_id_self_check" check/i);
  assert.match(migrationSql, /unique.*"code"/i);
});
