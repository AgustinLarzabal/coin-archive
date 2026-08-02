import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCurrency as createCurrencyFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createCurrency,
  createCurrencyIdempotently,
  deleteCurrency,
  deleteCurrencyIfVersionWithDatabase,
  replaceCurrencyWithDatabase,
  updateCurrency,
} from "./currency"

describe("currency mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Currency Code, Currency Name, and Currency Full Name before creating a Currency", async () => {
    await expect(
      createCurrency({
        code: "  united-states-dollar  ",
        name: "  Dollar  ",
        fullName: "  United States dollar  ",
      })
    ).resolves.toMatchObject({
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
  })

  it("rejects duplicate Currency Codes after normalization", async () => {
    await createCurrencyFixture({
      code: "euro",
      name: "Euro",
      fullName: "Euro",
    })

    await expect(
      createCurrency({
        code: " euro ",
        name: "Duplicate Euro",
        fullName: "Duplicate Euro",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "currency_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Currency Codes instead of silently normalizing them", async () => {
    await expect(
      createCurrency({
        code: "United States Dollar",
        name: "Dollar",
        fullName: "United States dollar",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "currency_code_slug_check",
      }),
    })
  })

  it("allows duplicate Currency Names when Currency Codes differ", async () => {
    const firstCurrency = await createCurrency({
      code: "argentine-peso",
      name: "Peso",
      fullName: "Argentine peso",
    })
    const secondCurrency = await createCurrency({
      code: "chilean-peso",
      name: "Peso",
      fullName: "Chilean peso",
    })

    expect(firstCurrency.name).toBe(secondCurrency.name)
    expect(firstCurrency.id).not.toBe(secondCurrency.id)
  })

  it("allows duplicate Currency Full Names when Currency Codes differ", async () => {
    const firstCurrency = await createCurrency({
      code: "test-dollar-a",
      name: "Dollar A",
      fullName: "Dollar",
    })
    const secondCurrency = await createCurrency({
      code: "test-dollar-b",
      name: "Dollar B",
      fullName: "Dollar",
    })

    expect(firstCurrency.fullName).toBe(secondCurrency.fullName)
    expect(firstCurrency.id).not.toBe(secondCurrency.id)
  })

  it("replays creation and atomically enforces Currency versions", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "currency-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: {
        code: " united-states-dollar ",
        name: " Dollar ",
        fullName: " United States dollar ",
      },
    }
    const first = await createCurrencyIdempotently(input)
    await expect(createCurrencyIdempotently(input)).resolves.toStrictEqual({
      status: "replayed",
      currency: first.status === "created" ? first.currency : expect.anything(),
    })
    if (first.status !== "created") throw new Error("Expected create")
    await expect(
      replaceCurrencyWithDatabase(db, {
        id: first.currency.id,
        expectedVersion: 1,
        code: "euro",
        name: "Euro",
        fullName: "Euro",
      })
    ).resolves.toMatchObject({
      status: "updated",
      currency: { version: 2, code: "euro" },
    })
    await expect(
      deleteCurrencyIfVersionWithDatabase(db, {
        id: first.currency.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteCurrencyIfVersionWithDatabase(db, {
        id: first.currency.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("trims Currency fields and updates updatedAt when updating a Currency", async () => {
    const existingCurrency = await createCurrencyFixture({
      code: "argentine-peso",
      name: "Peso",
      fullName: "Argentine peso",
    })

    const updatedCurrency = await updateCurrency({
      id: existingCurrency.id,
      code: " united-states-dollar ",
      name: " Dollar ",
      fullName: " United States dollar ",
    })

    expect(updatedCurrency).toMatchObject({
      id: existingCurrency.id,
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
    expect(updatedCurrency?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      existingCurrency.updatedAt.getTime()
    )
  })

  it("returns null when the Currency update target no longer exists", async () => {
    await expect(
      updateCurrency({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "euro",
        name: "Euro",
        fullName: "Euro",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Currency Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-currency-update",
      name: "Issuer for Currency Update",
    })
    const createdCurrency = await createCurrency({
      code: "argentine-peso",
      name: "Peso",
      fullName: "Argentine peso",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      currencyId: createdCurrency.id,
      title: "Currency-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedCurrency = await updateCurrency({
      id: createdCurrency.id,
      code: "chilean-peso",
      name: "Peso",
      fullName: "Chilean peso",
    })

    expect(updatedCurrency).toMatchObject({
      id: createdCurrency.id,
      code: "chilean-peso",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.currencyId).toBe(createdCurrency.id)
  })

  it("returns null when deleting a missing Currency", async () => {
    await expect(
      deleteCurrency({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Currency", async () => {
    const existingCurrency = await createCurrencyFixture({
      code: "obsolete-dollar",
      name: "Dollar",
      fullName: "Obsolete dollar",
    })

    await expect(
      deleteCurrency({
        id: existingCurrency.id,
      })
    ).resolves.toMatchObject({
      id: existingCurrency.id,
      code: "obsolete-dollar",
    })
  })

  it("rejects deleting a Currency while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-currency-delete",
      name: "Issuer for Currency Delete",
    })
    const existingCurrency = await createCurrencyFixture({
      code: "in-use-currency",
      name: "In Use Currency",
      fullName: "In Use Currency",
    })

    await createCoin({
      issuerId: issuer.id,
      currencyId: existingCurrency.id,
      title: "Currency Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteCurrency({
        id: existingCurrency.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_currency_id_currency_id_fk",
      }),
    })
  })
})
