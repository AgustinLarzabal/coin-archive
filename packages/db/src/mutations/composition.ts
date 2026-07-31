import { eq } from "drizzle-orm"

import { db } from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"

type CompositionFields = {
  code: string
  name: string
}

type UpdateCompositionInput = CompositionFields & {
  id: string
}

type DeleteCompositionInput = {
  id: string
}

function normalizeCompositionFields({ code, name }: CompositionFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createComposition(
  fields: CompositionFields
): Promise<Composition> {
  const [createdComposition] = await db
    .insert(composition)
    .values(normalizeCompositionFields(fields))
    .returning()

  return createdComposition
}

export async function updateComposition({
  id,
  ...fields
}: UpdateCompositionInput): Promise<Composition | null> {
  const updatedComposition = (
    await db
      .update(composition)
      .set({
        ...normalizeCompositionFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(composition.id, id))
      .returning()
  ).at(0)

  if (!updatedComposition) {
    return null
  }

  return updatedComposition
}

export async function deleteComposition({
  id,
}: DeleteCompositionInput): Promise<Composition | null> {
  const deletedComposition = (
    await db.delete(composition).where(eq(composition.id, id)).returning()
  ).at(0)

  if (!deletedComposition) {
    return null
  }

  return deletedComposition
}
