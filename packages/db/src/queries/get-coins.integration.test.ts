import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, getCoins } from "../index";
import { createCoin, createIssuer } from "../testing/fixtures";
import { clearTestData } from "../testing/test-database";

describe("getCoins integration", () => {
  afterAll(async () => {
    await clearTestData(db);
  });

  beforeEach(async () => {
    await clearTestData(db);
  });

  it("returns recent coins newest first", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    });

    await createCoin({
      title: "Earlier Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await createCoin({
      title: "Latest Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    });
    await createCoin({
      title: "Middle Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    await expect(getCoins()).resolves.toMatchObject([
      { title: "Latest Owl" },
      { title: "Middle Owl" },
      { title: "Earlier Owl" },
    ]);
  });

  it("applies the default recent coin limit of 10", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    });

    for (let index = 0; index < 12; index += 1) {
      await createCoin({
        title: `Roman Test Coin ${index + 1}`,
        issuerId: rome.id,
        createdAt: new Date(`2026-02-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
      });
    }

    const recentCoins = await getCoins();

    expect(recentCoins).toHaveLength(10);
    expect(recentCoins.map(({ title }) => title)).toStrictEqual([
      "Roman Test Coin 12",
      "Roman Test Coin 11",
      "Roman Test Coin 10",
      "Roman Test Coin 9",
      "Roman Test Coin 8",
      "Roman Test Coin 7",
      "Roman Test Coin 6",
      "Roman Test Coin 5",
      "Roman Test Coin 4",
      "Roman Test Coin 3",
    ]);
  });

  it("filters by issuer code including descendant issuers and excluding unrelated issuers", async () => {
    const ancientGreece = await createIssuer({
      code: "ancient-greece",
      name: "Ancient Greece",
    });
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
      parentIssuerId: ancientGreece.id,
    });
    const athensClassical = await createIssuer({
      code: "athens-classical",
      name: "Athens Classical",
      parentIssuerId: athens.id,
    });
    const sparta = await createIssuer({
      code: "sparta",
      name: "Sparta",
    });

    await createCoin({
      title: "Greek Union Coin",
      issuerId: ancientGreece.id,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    await createCoin({
      title: "Athenian Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-03-02T00:00:00.000Z"),
    });
    await createCoin({
      title: "Classical Athena",
      issuerId: athensClassical.id,
      createdAt: new Date("2026-03-03T00:00:00.000Z"),
    });
    await createCoin({
      title: "Spartan Shield",
      issuerId: sparta.id,
      createdAt: new Date("2026-03-04T00:00:00.000Z"),
    });

    const filteredCoins = await getCoins({
      issuerCode: "ancient-greece",
    });

    expect(filteredCoins.map(({ title }) => title)).toStrictEqual([
      "Classical Athena",
      "Athenian Owl",
      "Greek Union Coin",
    ]);
  });

  it("returns an empty list for an unknown issuer code", async () => {
    const carthage = await createIssuer({
      code: "carthage",
      name: "Carthage",
    });

    await createCoin({
      title: "Punic Bronze",
      issuerId: carthage.id,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    await expect(
      getCoins({
        issuerCode: "unknown-issuer",
      })
    ).resolves.toStrictEqual([]);
  });
});
