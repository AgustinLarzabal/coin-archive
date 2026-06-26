import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createEdge as createEdgeFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createEdge, deleteEdge, updateEdge } from "./edge"

describe("edge mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Edge Code and Edge Name before creating an Edge", async () => {
    await expect(
      createEdge({
        code: "  reeded  ",
        name: "  Reeded  ",
      })
    ).resolves.toMatchObject({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("rejects duplicate Edge Codes after normalization", async () => {
    await createEdgeFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      createEdge({
        code: " reeded ",
        name: "Duplicate Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "edge_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Edge Codes instead of silently normalizing them", async () => {
    await expect(
      createEdge({
        code: "Reeded",
        name: "Reeded",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "edge_code_slug_check",
      }),
    })
  })

  it("allows duplicate Edge Names when Edge Codes differ", async () => {
    const firstEdge = await createEdge({
      code: "reeded",
      name: "Reeded",
    })
    const secondEdge = await createEdge({
      code: "reeded-variant",
      name: "Reeded",
    })

    expect(firstEdge.name).toBe(secondEdge.name)
    expect(firstEdge.id).not.toBe(secondEdge.id)
  })

  it("trims Edge Code and Edge Name before updating an Edge", async () => {
    const existingEdge = await createEdgeFixture({
      code: "reeded",
      name: "Reeded",
    })

    await expect(
      updateEdge({
        id: existingEdge.id,
        code: "  lettered  ",
        name: "  Lettered  ",
      })
    ).resolves.toMatchObject({
      id: existingEdge.id,
      code: "lettered",
      name: "Lettered",
    })
  })

  it("returns null when the Edge update target no longer exists", async () => {
    await expect(
      updateEdge({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "reeded",
        name: "Reeded",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when an Edge Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-edge-update",
      name: "Issuer for Edge Update",
    })
    const createdEdge = await createEdge({
      code: "reeded",
      name: "Reeded",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      edgeId: createdEdge.id,
      title: "Edge-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedEdge = await updateEdge({
      id: createdEdge.id,
      code: "lettered",
      name: "Lettered",
    })

    expect(updatedEdge).toMatchObject({
      id: createdEdge.id,
      code: "lettered",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.edgeId).toBe(createdEdge.id)
  })

  it("returns null when deleting a missing Edge", async () => {
    await expect(
      deleteEdge({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Edge", async () => {
    const existingEdge = await createEdgeFixture({
      code: "obsolete-edge",
      name: "Obsolete Edge",
    })

    await expect(
      deleteEdge({
        id: existingEdge.id,
      })
    ).resolves.toMatchObject({
      id: existingEdge.id,
      code: "obsolete-edge",
    })
  })

  it("rejects deleting an Edge while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-edge-delete",
      name: "Issuer for Edge Delete",
    })
    const existingEdge = await createEdgeFixture({
      code: "in-use-edge",
      name: "In Use Edge",
    })

    await createCoin({
      issuerId: issuer.id,
      edgeId: existingEdge.id,
      title: "Edge Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteEdge({
        id: existingEdge.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_edge_id_edge_id_fk",
      }),
    })
  })
})
