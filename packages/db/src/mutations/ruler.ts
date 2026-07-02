import { eq } from "drizzle-orm"

import { db } from "../client"
import { ruler } from "../schema/ruler"
import type { Ruler } from "../schema/ruler"

type RulerFields = {
  code: string
  name: string
  rulerGroupId: string | null
}

type UpdateRulerInput = RulerFields & {
  id: string
}

type DeleteRulerInput = {
  id: string
}

function normalizeRulerGroupId(rulerGroupId: string | null) {
  const normalizedRulerGroupId = rulerGroupId?.trim()

  if (
    normalizedRulerGroupId === undefined ||
    normalizedRulerGroupId.length === 0
  ) {
    return null
  }

  return normalizedRulerGroupId
}

function normalizeRulerFields({ code, name, rulerGroupId }: RulerFields) {
  return {
    code: code.trim(),
    name: name.trim(),
    rulerGroupId: normalizeRulerGroupId(rulerGroupId),
  }
}

export async function createRuler(fields: RulerFields): Promise<Ruler> {
  const [createdRuler] = await db
    .insert(ruler)
    .values(normalizeRulerFields(fields))
    .returning()

  return createdRuler
}

export async function updateRuler({
  id,
  ...fields
}: UpdateRulerInput): Promise<Ruler | null> {
  const updatedRuler = (
    await db
      .update(ruler)
      .set({
        ...normalizeRulerFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(ruler.id, id))
      .returning()
  ).at(0)

  return updatedRuler ?? null
}

export async function deleteRuler({
  id,
}: DeleteRulerInput): Promise<Ruler | null> {
  const deletedRuler = (
    await db.delete(ruler).where(eq(ruler.id, id)).returning()
  ).at(0)

  return deletedRuler ?? null
}
