import { eq } from "drizzle-orm"

import { db } from "../client"
import { shape } from "../schema/shape"
import type { Shape } from "../schema/shape"

type ShapeFields = {
  code: string
  name: string
}

type UpdateShapeInput = ShapeFields & {
  id: string
}

type DeleteShapeInput = {
  id: string
}

function normalizeShapeFields({ code, name }: ShapeFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createShape(fields: ShapeFields): Promise<Shape> {
  const [createdShape] = await db
    .insert(shape)
    .values(normalizeShapeFields(fields))
    .returning()

  return createdShape
}

export async function updateShape({
  id,
  ...fields
}: UpdateShapeInput): Promise<Shape | null> {
  const [updatedShape] = await db
    .update(shape)
    .set({
      ...normalizeShapeFields(fields),
      updatedAt: new Date(),
    })
    .where(eq(shape.id, id))
    .returning()

  return updatedShape ?? null
}

export async function deleteShape({
  id,
}: DeleteShapeInput): Promise<Shape | null> {
  const [deletedShape] = await db
    .delete(shape)
    .where(eq(shape.id, id))
    .returning()

  return deletedShape ?? null
}
