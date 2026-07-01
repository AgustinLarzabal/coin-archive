import { eq } from "drizzle-orm"

import { db } from "../client"
import { rulerGroup } from "../schema/ruler-group"
import type { RulerGroup } from "../schema/ruler-group"

type RulerGroupFields = {
  code: string
  name: string
}

type UpdateRulerGroupInput = RulerGroupFields & {
  id: string
}

type DeleteRulerGroupInput = {
  id: string
}

function normalizeRulerGroupFields({ code, name }: RulerGroupFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createRulerGroup(
  fields: RulerGroupFields
): Promise<RulerGroup> {
  const [createdRulerGroup] = await db
    .insert(rulerGroup)
    .values(normalizeRulerGroupFields(fields))
    .returning()

  return createdRulerGroup
}

export async function updateRulerGroup({
  id,
  ...fields
}: UpdateRulerGroupInput): Promise<RulerGroup | null> {
  const updatedRulerGroup = (
    await db
      .update(rulerGroup)
      .set({
        ...normalizeRulerGroupFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(rulerGroup.id, id))
      .returning()
  ).at(0)

  return updatedRulerGroup ?? null
}

export async function deleteRulerGroup({
  id,
}: DeleteRulerGroupInput): Promise<RulerGroup | null> {
  const deletedRulerGroup = (
    await db.delete(rulerGroup).where(eq(rulerGroup.id, id)).returning()
  ).at(0)

  return deletedRulerGroup ?? null
}
