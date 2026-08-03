import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createIssuer as createIssuerFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createIssuer,
  createIssuerIdempotently,
  createIssuerIdempotentlyWithDatabase,
  deleteIssuer,
  deleteIssuerIfVersionWithDatabase,
  replaceIssuerWithDatabase,
  updateIssuer,
} from "./issuer"

describe("issuer mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Issuer fields and uppercases the ISO code before creating an Issuer", async () => {
    await expect(
      createIssuer({
        code: "  argentine-republic  ",
        isoCode: " ar ",
        name: "  Argentine Republic  ",
        parentIssuerId: null,
      })
    ).resolves.toMatchObject({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
      parentIssuerId: null,
    })
  })

  it("rejects duplicate Issuer Codes after normalization", async () => {
    await createIssuerFixture({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })

    await expect(
      createIssuer({
        code: " argentine-republic ",
        isoCode: "ar",
        name: "Duplicate Argentine Republic",
        parentIssuerId: null,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "issuer_code_unique_idx",
      }),
    })
  })

  it("rejects invalid Issuer Codes instead of silently normalizing them", async () => {
    await expect(
      createIssuer({
        code: "Argentine-Republic",
        isoCode: "AR",
        name: "Argentine Republic",
        parentIssuerId: null,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "issuer_code_slug_check",
      }),
    })
  })

  it("rejects invalid Issuer ISO Codes after normalization", async () => {
    await expect(
      createIssuer({
        code: "argentine-republic",
        isoCode: " a1 ",
        name: "Argentine Republic",
        parentIssuerId: null,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "issuer_iso_code_format_check",
      }),
    })
  })

  it("allows duplicate Issuer Names when Issuer Codes differ", async () => {
    const firstIssuer = await createIssuer({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentina",
      parentIssuerId: null,
    })
    const secondIssuer = await createIssuer({
      code: "argentina-provincial",
      isoCode: "AR",
      name: "Argentina",
      parentIssuerId: null,
    })

    expect(firstIssuer.name).toBe(secondIssuer.name)
    expect(firstIssuer.id).not.toBe(secondIssuer.id)
  })

  it("persists and replays an identical idempotent Issuer create", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "issuer-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: {
        code: " argentine-republic ",
        isoCode: " ar ",
        name: " Argentine Republic ",
        parentIssuerId: null,
      },
    }
    const first = await createIssuerIdempotently(input)
    const retry = await createIssuerIdempotently(input)

    expect(first).toMatchObject({
      status: "created",
      issuer: {
        code: "argentine-republic",
        isoCode: "AR",
        name: "Argentine Republic",
        version: 1,
      },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      issuer: first.status === "created" ? first.issuer : expect.anything(),
    })
    await expect(db.query.issuer.findMany()).resolves.toHaveLength(1)
  })

  it("rejects payload-mismatched reuse of an Issuer create key", async () => {
    const input = {
      collectorId: "collector-1",
      idempotencyKey: "issuer-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: {
        code: "argentine-republic",
        isoCode: "AR",
        name: "Argentine Republic",
        parentIssuerId: null,
      },
    }
    await createIssuerIdempotently(input)

    await expect(
      createIssuerIdempotently({
        ...input,
        requestHash: "b".repeat(64),
        fields: {
          code: "roman-empire",
          isoCode: "IT",
          name: "Roman Empire",
          parentIssuerId: null,
        },
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await expect(db.query.issuer.findMany()).resolves.toHaveLength(1)
  })

  it("atomically enforces Issuer versions for replacement and deletion", async () => {
    const created = await createIssuerIdempotentlyWithDatabase(db, {
      collectorId: "collector-1",
      idempotencyKey: "issuer-request-scoped-create",
      requestHash: "f".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
      fields: {
        code: "argentine-republic",
        isoCode: "AR",
        name: "Argentine Republic",
        parentIssuerId: null,
      },
    })
    if (created.status !== "created") throw new Error("Expected create")

    await expect(
      replaceIssuerWithDatabase(db, {
        id: created.issuer.id,
        expectedVersion: 1,
        code: " roman-empire ",
        isoCode: " it ",
        name: " Roman Empire ",
        parentIssuerId: null,
      })
    ).resolves.toMatchObject({
      status: "updated",
      issuer: {
        version: 2,
        code: "roman-empire",
        isoCode: "IT",
        name: "Roman Empire",
      },
    })
    await expect(
      replaceIssuerWithDatabase(db, {
        id: created.issuer.id,
        expectedVersion: 1,
        code: "argentine-republic",
        isoCode: "AR",
        name: "Argentine Republic",
        parentIssuerId: null,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteIssuerIfVersionWithDatabase(db, {
        id: created.issuer.id,
        expectedVersion: 1,
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(
      deleteIssuerIfVersionWithDatabase(db, {
        id: created.issuer.id,
        expectedVersion: 2,
      })
    ).resolves.toMatchObject({ status: "deleted" })
  })

  it("trims fields, uppercases ISO code, and updates the parent issuer", async () => {
    const parentIssuer = await createIssuerFixture({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })
    const childIssuer = await createIssuerFixture({
      code: "la-rioja",
      isoCode: "AR",
      name: "La Rioja",
    })

    await expect(
      updateIssuer({
        id: childIssuer.id,
        code: "  provincia-de-la-rioja  ",
        isoCode: " ar ",
        name: "  Provincia de La Rioja  ",
        parentIssuerId: parentIssuer.id,
      })
    ).resolves.toMatchObject({
      id: childIssuer.id,
      code: "provincia-de-la-rioja",
      isoCode: "AR",
      name: "Provincia de La Rioja",
      parentIssuerId: parentIssuer.id,
    })
  })

  it("preserves the explicit Issuer ISO Code when reparenting and allows clearing the parent", async () => {
    const argentineRepublic = await createIssuerFixture({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })
    const romanEmpire = await createIssuerFixture({
      code: "roman-empire",
      isoCode: "IT",
      name: "Roman Empire",
    })
    const laRioja = await createIssuerFixture({
      code: "la-rioja",
      isoCode: "AR",
      name: "La Rioja",
      parentIssuerId: argentineRepublic.id,
    })

    await expect(
      updateIssuer({
        id: laRioja.id,
        code: laRioja.code,
        isoCode: " ar ",
        name: laRioja.name,
        parentIssuerId: romanEmpire.id,
      })
    ).resolves.toMatchObject({
      id: laRioja.id,
      code: "la-rioja",
      isoCode: "AR",
      name: "La Rioja",
      parentIssuerId: romanEmpire.id,
    })

    await expect(
      updateIssuer({
        id: laRioja.id,
        code: laRioja.code,
        isoCode: "AR",
        name: laRioja.name,
        parentIssuerId: null,
      })
    ).resolves.toMatchObject({
      id: laRioja.id,
      code: "la-rioja",
      isoCode: "AR",
      name: "La Rioja",
      parentIssuerId: null,
    })
  })

  it("returns null when the Issuer update target no longer exists", async () => {
    await expect(
      updateIssuer({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "argentine-republic",
        isoCode: "AR",
        name: "Argentine Republic",
        parentIssuerId: null,
      })
    ).resolves.toBeNull()
  })

  it("rejects self-parenting during update", async () => {
    const existingIssuer = await createIssuerFixture({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })

    await expect(
      updateIssuer({
        id: existingIssuer.id,
        code: existingIssuer.code,
        isoCode: existingIssuer.isoCode,
        name: existingIssuer.name,
        parentIssuerId: existingIssuer.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "issuer_parent_issuer_id_cycle_check",
      }),
    })
  })

  it("rejects cycles during update", async () => {
    const parentIssuer = await createIssuerFixture({
      code: "roman-empire",
      isoCode: "IT",
      name: "Roman Empire",
    })
    const childIssuer = await createIssuerFixture({
      code: "byzantine-empire",
      isoCode: "TR",
      name: "Byzantine Empire",
      parentIssuerId: parentIssuer.id,
    })

    await expect(
      updateIssuer({
        id: parentIssuer.id,
        code: parentIssuer.code,
        isoCode: parentIssuer.isoCode,
        name: parentIssuer.name,
        parentIssuerId: childIssuer.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "issuer_parent_issuer_id_cycle_check",
      }),
    })
  })

  it("returns null when deleting a missing Issuer", async () => {
    await expect(
      deleteIssuer({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Issuer", async () => {
    const existingIssuer = await createIssuerFixture({
      code: "obsolete-issuer",
      isoCode: "ZZ",
      name: "Obsolete Issuer",
    })

    await expect(
      deleteIssuer({
        id: existingIssuer.id,
      })
    ).resolves.toMatchObject({
      id: existingIssuer.id,
      code: "obsolete-issuer",
    })
  })

  it("rejects deleting an Issuer while Coins still use it", async () => {
    const existingIssuer = await createIssuerFixture({
      code: "issuer-for-delete",
      isoCode: "AR",
      name: "Issuer For Delete",
    })

    await createCoin({
      issuerId: existingIssuer.id,
      title: "Issuer Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteIssuer({
        id: existingIssuer.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_issuer_id_issuer_id_fk",
      }),
    })
  })

  it("rejects deleting an Issuer while child Issuers still reference it", async () => {
    const parentIssuer = await createIssuerFixture({
      code: "roman-empire",
      isoCode: "IT",
      name: "Roman Empire",
    })

    await createIssuerFixture({
      code: "byzantine-empire",
      isoCode: "TR",
      name: "Byzantine Empire",
      parentIssuerId: parentIssuer.id,
    })

    await expect(
      deleteIssuer({
        id: parentIssuer.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "issuer_parent_issuer_id_issuer_id_fk",
      }),
    })
  })
})
