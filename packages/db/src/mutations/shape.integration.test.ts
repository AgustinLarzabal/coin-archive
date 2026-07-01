import { describe, expect, it } from "vitest"

import { db } from "../index"
import {
  createCoin,
  createShape as createShapeFixture,
  createIssuer,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createShape, deleteShape, updateShape } from "./shape"

describe("shape mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims Shape Code and Shape Name before creating a Shape", async () => {
    await expect(
      createShape({
        code: "  round  ",
        name: "  Round  ",
      })
    ).resolves.toMatchObject({
      code: "round",
      name: "Round",
    })
  })

  it("rejects duplicate Shape Codes after normalization", async () => {
    await createShapeFixture({
      code: "round",
      name: "Round",
    })

    await expect(
      createShape({
        code: " round ",
        name: "Duplicate Round",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23505",
        constraint_name: "shape_code_lower_unique_idx",
      }),
    })
  })

  it("rejects invalid Shape Codes instead of silently normalizing them", async () => {
    await expect(
      createShape({
        code: "Round",
        name: "Round",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "shape_code_slug_check",
      }),
    })
  })

  it("allows duplicate Shape Names when Shape Codes differ", async () => {
    const firstShape = await createShape({
      code: "round",
      name: "Round",
    })
    const secondShape = await createShape({
      code: "round-variant",
      name: "Round",
    })

    expect(firstShape.name).toBe(secondShape.name)
    expect(firstShape.id).not.toBe(secondShape.id)
  })

  it("trims Shape Code and Shape Name before updating a Shape", async () => {
    const existingShape = await createShapeFixture({
      code: "round",
      name: "Round",
    })

    await expect(
      updateShape({
        id: existingShape.id,
        code: "  scalloped  ",
        name: "  Scalloped  ",
      })
    ).resolves.toMatchObject({
      id: existingShape.id,
      code: "scalloped",
      name: "Scalloped",
    })
  })

  it("returns null when the Shape update target no longer exists", async () => {
    await expect(
      updateShape({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "round",
        name: "Round",
      })
    ).resolves.toBeNull()
  })

  it("preserves existing Coin relationships when a Shape Code changes", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-shape-update",
      name: "Issuer for Shape Update",
    })
    const createdShape = await createShape({
      code: "round",
      name: "Round",
    })
    const createdCoin = await createCoin({
      issuerId: issuer.id,
      shapeId: createdShape.id,
      title: "Shape-linked coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    const updatedShape = await updateShape({
      id: createdShape.id,
      code: "scalloped",
      name: "Scalloped",
    })

    expect(updatedShape).toMatchObject({
      id: createdShape.id,
      code: "scalloped",
    })

    const persistedCoin = await db.query.coin.findFirst({
      where: (coin, { eq }) => eq(coin.id, createdCoin.id),
    })

    expect(persistedCoin?.shapeId).toBe(createdShape.id)
  })

  it("returns null when deleting a missing Shape", async () => {
    await expect(
      deleteShape({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      })
    ).resolves.toBeNull()
  })

  it("deletes an unused Shape", async () => {
    const existingShape = await createShapeFixture({
      code: "obsolete-shape",
      name: "Obsolete Shape",
    })

    await expect(
      deleteShape({
        id: existingShape.id,
      })
    ).resolves.toMatchObject({
      id: existingShape.id,
      code: "obsolete-shape",
    })
  })

  it("rejects deleting a Shape while Coins still use it", async () => {
    const issuer = await createIssuer({
      code: "issuer-for-shape-delete",
      name: "Issuer for Shape Delete",
    })
    const existingShape = await createShapeFixture({
      code: "in-use-shape",
      name: "In Use Shape",
    })

    await createCoin({
      issuerId: issuer.id,
      shapeId: existingShape.id,
      title: "Shape Restrict Delete Coin",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
    })

    await expect(
      deleteShape({
        id: existingShape.id,
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23001",
        constraint_name: "coin_shape_id_shape_id_fk",
      }),
    })
  })
})
