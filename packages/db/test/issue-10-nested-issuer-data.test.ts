import assert from "node:assert/strict";
import test from "node:test";
import type { GetCoinsRow } from "../src/queries/map-get-coins-row";
import { mapGetCoinsRowToCoinRecord } from "../src/queries/map-get-coins-row";

function createGetCoinsRow(overrides: Partial<GetCoinsRow> = {}): GetCoinsRow {
  return {
    id: "coin-1",
    title: "Buenos Aires 8 Reales",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    issuerCode: "buenos-aires",
    issuerName: "Buenos Aires",
    parentIssuerCode: "argentina",
    parentIssuerName: "Argentina",
    ...overrides,
  };
}

test("getCoins maps issuer data into a nested payload with one parent level", () => {
  const coinWithParentIssuer = mapGetCoinsRowToCoinRecord(createGetCoinsRow());

  assert.deepEqual(coinWithParentIssuer, {
    id: "coin-1",
    title: "Buenos Aires 8 Reales",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    issuer: {
      code: "buenos-aires",
      name: "Buenos Aires",
      parent: {
        code: "argentina",
        name: "Argentina",
      },
    },
  });

  assert.equal("issuerCode" in coinWithParentIssuer, false);
  assert.equal("issuerName" in coinWithParentIssuer, false);
  assert.equal("parentIssuerCode" in coinWithParentIssuer, false);
  assert.equal("parentIssuerName" in coinWithParentIssuer, false);
  assert.equal("parent" in coinWithParentIssuer.issuer.parent, false);
});

test("getCoins returns a null issuer parent when the direct issuer is a root issuer", () => {
  const coinWithRootIssuer = mapGetCoinsRowToCoinRecord(
    createGetCoinsRow({
      id: "coin-2",
      title: "United States Cent",
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      updatedAt: new Date("2026-01-03T00:00:00.000Z"),
      issuerCode: "united-states",
      issuerName: "United States of America",
      parentIssuerCode: null,
      parentIssuerName: null,
    }),
  );

  assert.equal(coinWithRootIssuer.issuer.parent, null);
});

test("getCoins returns a null issuer parent when parent issuer data is incomplete", () => {
  const coinWithIncompleteParentIssuer = mapGetCoinsRowToCoinRecord(
    createGetCoinsRow({
      parentIssuerCode: "argentina",
      parentIssuerName: null,
    }),
  );

  assert.equal(coinWithIncompleteParentIssuer.issuer.parent, null);
});
