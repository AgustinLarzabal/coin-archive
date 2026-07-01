import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createCoinMint,
  createIssuer,
  createMint as createMintFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createMint, deleteMint, updateMint } from "./mint"

const DUPLICATE_MINT_CODE_CONSTRAINT = {
  code: "23505",
  constraint_name: "mint_code_lower_unique_idx",
} as const

const INVALID_MINT_CODE_CONSTRAINT = {
  code: "23514",
  constraint_name: "mint_code_slug_check",
} as const

type MintConstraint =
  | typeof DUPLICATE_MINT_CODE_CONSTRAINT
  | typeof INVALID_MINT_CODE_CONSTRAINT

async function expectConstraintViolation(
  mutation: Promise<unknown>,
  constraint: MintConstraint
) {
  await expect(mutation).rejects.toMatchObject({
    cause: expect.objectContaining(constraint),
  })
}

describe("mint mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Mint Code and Mint Name before creating a Mint", async () => {
    await expect(
      createMint({
        code: "  buenos-aires-mint  ",
        name: "  Buenos Aires Mint  ",
      })
    ).resolves.toMatchObject({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
  })

  it("rejects duplicate Mint Codes after normalization", async () => {
    await createMintFixture({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })

    await expectConstraintViolation(
      createMint({
        code: " buenos-aires-mint ",
        name: "Duplicate Buenos Aires Mint",
      }),
      DUPLICATE_MINT_CODE_CONSTRAINT
    )
  })

  it("rejects invalid Mint Codes instead of silently normalizing them", async () => {
    await expectConstraintViolation(
      createMint({
        code: "Buenos-Aires-Mint",
        name: "Buenos Aires Mint",
      }),
      INVALID_MINT_CODE_CONSTRAINT
    )
  })

  it("allows duplicate Mint Names when Mint Codes differ", async () => {
    const firstMint = await createMint({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
    const secondMint = await createMint({
      code: "buenos-aires-mint-branch",
      name: "Buenos Aires Mint",
    })

    expect(firstMint.name).toBe(secondMint.name)
    expect(firstMint.id).not.toBe(secondMint.id)
  })

  it("trims Mint Code and Mint Name before updating a Mint", async () => {
    const existingMint = await createMintFixture({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })

    await expect(
      updateMint({
        id: existingMint.id,
        code: "  royal-mint-of-madrid  ",
        name: "  Royal Mint of Madrid  ",
      })
    ).resolves.toMatchObject({
      id: existingMint.id,
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
  })

  it("updates the Mint timestamp in place", async () => {
    const existingMint = await createMintFixture({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })

    await new Promise((resolve) => setTimeout(resolve, 5))

    const updatedMint = await updateMint({
      id: existingMint.id,
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })

    expect(updatedMint).toMatchObject({
      id: existingMint.id,
      createdAt: existingMint.createdAt,
    })
    expect(updatedMint?.updatedAt.getTime()).toBeGreaterThan(
      existingMint.updatedAt.getTime()
    )
  })

  it("rejects duplicate Mint Codes after normalization during update", async () => {
    await createMintFixture({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
    const conflictingMint = await createMintFixture({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })

    await expectConstraintViolation(
      updateMint({
        id: conflictingMint.id,
        code: " buenos-aires-mint ",
        name: "Updated Royal Mint of Madrid",
      }),
      DUPLICATE_MINT_CODE_CONSTRAINT
    )

    await expect(
      db.query.mint.findFirst({
        where: (mint, { eq }) => eq(mint.id, conflictingMint.id),
      })
    ).resolves.toMatchObject({
      id: conflictingMint.id,
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
  })

  it("rejects invalid Mint Codes during update instead of silently normalizing them", async () => {
    const existingMint = await createMintFixture({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })

    await expectConstraintViolation(
      updateMint({
        id: existingMint.id,
        code: "Buenos-Aires-Mint",
        name: "Updated Buenos Aires Mint",
      }),
      INVALID_MINT_CODE_CONSTRAINT
    )
  })

  it("returns null when the Mint update target no longer exists", async () => {
    await expect(
      updateMint({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "buenos-aires-mint",
        name: "Buenos Aires Mint",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin Mint Attributions when a Mint Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-mint-update",
      name: "Issuer for Mint Update",
    })
    const createdMint = await createMint({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Mint-linked coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await createCoinMint({
      coinId: createdCoin.id,
      mintId: createdMint.id,
    })

    const updatedMint = await updateMint({
      id: createdMint.id,
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })

    expect(updatedMint).toMatchObject({
      id: createdMint.id,
      code: "royal-mint-of-madrid",
    })

    const persistedAttribution = await db.query.coinMint.findFirst({
      where: (coinMint, { and, eq }) =>
        and(
          eq(coinMint.coinId, createdCoin.id),
          eq(coinMint.mintId, createdMint.id)
        ),
    })

    expect(persistedAttribution).not.toBeNull()
  })

  it("returns null when deleting a missing Mint", async () => {
    await expect(
      deleteMint({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Mint", async () => {
    const existingMint = await createMintFixture({
      code: "obsolete-mint",
      name: "Obsolete Mint",
    })

    await expect(
      deleteMint({
        id: existingMint.id,
      })
    ).resolves.toMatchObject({
      id: existingMint.id,
      code: "obsolete-mint",
    })
  })

  it("rejects deleting a Mint while Coin Mint Attributions still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-mint-delete",
      name: "Issuer for Mint Delete",
    })
    const existingMint = await createMintFixture({
      code: "in-use-mint",
      name: "In Use Mint",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      title: "Mint Restrict Delete Coin",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await createCoinMint({
      coinId: createdCoin.id,
      mintId: existingMint.id,
    })

    await expect(
      deleteMint({
        id: existingMint.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_mint_mint_id_mint_id_fk",
      }),
    })
  })
})
