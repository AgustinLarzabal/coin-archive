import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createIssuer as createIssuerFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createIssuer, deleteIssuer, updateIssuer } from "./issuer"

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
