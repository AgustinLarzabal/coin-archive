import { eq } from "drizzle-orm"

import { db } from "../client"
import { rim } from "../schema/rim"
import type { Rim } from "../schema/rim"

type RimFields = {
  code: string
  name: string
}

type UpdateRimInput = RimFields & {
  id: string
}

type DeleteRimInput = {
  id: string
}

function normalizeRimFields({ code, name }: RimFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createRim(fields: RimFields): Promise<Rim> {
  const [createdRim] = await db
    .insert(rim)
    .values(normalizeRimFields(fields))
    .returning()

  return createdRim
}

export async function updateRim({
  id,
  ...fields
}: UpdateRimInput): Promise<Rim | null> {
  const [updatedRim] = await db
    .update(rim)
    .set({
      ...normalizeRimFields(fields),
      updatedAt: new Date(),
    })
    .where(eq(rim.id, id))
    .returning()

  return updatedRim ?? null
}

export async function deleteRim({ id }: DeleteRimInput): Promise<Rim | null> {
  const [deletedRim] = await db.delete(rim).where(eq(rim.id, id)).returning()

  return deletedRim ?? null
}
