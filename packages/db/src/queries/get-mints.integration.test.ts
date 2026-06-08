import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createMint } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getMints } from "./get-mints"

describe("getMints integration", () => {
  useTestDatabaseIsolation(db)

  it("returns mint options sorted by name and code", async () => {
    const buenosAiresMint = await createMint({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
    const denverMint = await createMint({
      code: "denver-mint",
      name: "Mint",
    })
    const philadelphiaMint = await createMint({
      code: "philadelphia-mint",
      name: "Mint",
    })
    const royalMintOfMadrid = await createMint({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })

    await expect(getMints()).resolves.toStrictEqual([
      {
        id: buenosAiresMint.id,
        code: "buenos-aires-mint",
        name: "Buenos Aires Mint",
        createdAt: buenosAiresMint.createdAt,
        updatedAt: buenosAiresMint.updatedAt,
      },
      {
        id: denverMint.id,
        code: "denver-mint",
        name: "Mint",
        createdAt: denverMint.createdAt,
        updatedAt: denverMint.updatedAt,
      },
      {
        id: philadelphiaMint.id,
        code: "philadelphia-mint",
        name: "Mint",
        createdAt: philadelphiaMint.createdAt,
        updatedAt: philadelphiaMint.updatedAt,
      },
      {
        id: royalMintOfMadrid.id,
        code: "royal-mint-of-madrid",
        name: "Royal Mint of Madrid",
        createdAt: royalMintOfMadrid.createdAt,
        updatedAt: royalMintOfMadrid.updatedAt,
      },
    ])
  })
})
