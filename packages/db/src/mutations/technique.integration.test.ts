import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createIssuer,
  createTechnique as createTechniqueFixture,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createTechnique, deleteTechnique, updateTechnique } from "./technique"

describe("technique mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Minting Technique Code and Minting Technique Name before creating a Minting Technique", async () => {
    await expect(
      createTechnique({
        code: "  hammered  ",
        name: "  Hammered  ",
      })
    ).resolves.toMatchObject({
      code: "hammered",
      name: "Hammered",
    })
  })

  it("rejects duplicate Minting Technique Codes after normalization", async () => {
    await createTechniqueFixture({
      code: "hammered",
      name: "Hammered",
    })

    await expect(
      createTechnique({
        code: " hammered ",
        name: "Duplicate Hammered",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "technique_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Minting Technique Codes instead of silently normalizing them", async () => {
    await expect(
      createTechnique({
        code: "Hammered",
        name: "Hammered",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "technique_code_slug_check",
      }),
    })
  })

  it("allows duplicate Minting Technique Names when Minting Technique Codes differ", async () => {
    const firstTechnique = await createTechnique({
      code: "hammered",
      name: "Hammered",
    })
    const secondTechnique = await createTechnique({
      code: "hammered-variant",
      name: "Hammered",
    })

    expect(firstTechnique.name).toBe(secondTechnique.name)
    expect(firstTechnique.id).not.toBe(secondTechnique.id)
  })

  it("trims Minting Technique Code and Minting Technique Name before updating a Minting Technique", async () => {
    const existingTechnique = await createTechniqueFixture({
      code: "hammered",
      name: "Hammered",
    })

    await expect(
      updateTechnique({
        id: existingTechnique.id,
        code: "  machine-struck  ",
        name: "  Machine struck  ",
      })
    ).resolves.toMatchObject({
      id: existingTechnique.id,
      code: "machine-struck",
      name: "Machine struck",
    })
  })

  it("returns null when the Minting Technique update target no longer exists", async () => {
    await expect(
      updateTechnique({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "hammered",
        name: "Hammered",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when an in-use Minting Technique is edited", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-technique-update",
      name: "Issuer for Technique Update",
    })
    const createdTechnique = await createTechnique({
      code: "hammered",
      name: "Hammered",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      techniqueId: createdTechnique.id,
      title: "Technique-linked coin",
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
    })

    const updatedTechnique = await updateTechnique({
      id: createdTechnique.id,
      code: "machine-struck",
      name: "Machine struck",
    })

    expect(updatedTechnique).toMatchObject({
      id: createdTechnique.id,
      code: "machine-struck",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.techniqueId).toBe(createdTechnique.id)
  })

  it("deletes an unused Minting Technique", async () => {
    const existingTechnique = await createTechniqueFixture({
      code: "obsolete-technique",
      name: "Obsolete Technique",
    })

    await expect(
      deleteTechnique({
        id: existingTechnique.id,
      })
    ).resolves.toMatchObject({
      id: existingTechnique.id,
      code: "obsolete-technique",
    })
  })

  it("returns null when deleting a missing Minting Technique", async () => {
    await expect(
      deleteTechnique({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("rejects deleting a Minting Technique while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-technique-delete",
      name: "Issuer for Technique Delete",
    })
    const existingTechnique = await createTechniqueFixture({
      code: "in-use-technique",
      name: "In Use Technique",
    })

    await createCoin({
      issuerId: issuer.id,
      techniqueId: existingTechnique.id,
      title: "Technique Restrict Delete Coin",
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
    })

    await expect(
      deleteTechnique({
        id: existingTechnique.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_technique_id_technique_id_fk",
      }),
    })
  })
})
