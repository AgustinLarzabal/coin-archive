import { eq } from "drizzle-orm"

import { db } from "../client"
import { engraver } from "../schema/engraver"
import type { Engraver } from "../schema/engraver"

type EngraverFields = {
  code: string
  name: string
}

type UpdateEngraverInput = EngraverFields & {
  id: string
}

type DeleteEngraverInput = {
  id: string
}

function normalizeEngraverFields({ code, name }: EngraverFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createEngraver(fields: EngraverFields): Promise<Engraver> {
  const [createdEngraver] = await db
    .insert(engraver)
    .values(normalizeEngraverFields(fields))
    .returning()

  return createdEngraver
}

export async function updateEngraver({
  id,
  ...fields
}: UpdateEngraverInput): Promise<Engraver | null> {
  const [updatedEngraver] = await db
    .update(engraver)
    .set({
      ...normalizeEngraverFields(fields),
      updatedAt: new Date(),
    })
    .where(eq(engraver.id, id))
    .returning()

  return updatedEngraver ?? null
}

export async function deleteEngraver({
  id,
}: DeleteEngraverInput): Promise<Engraver | null> {
  const [deletedEngraver] = await db
    .delete(engraver)
    .where(eq(engraver.id, id))
    .returning()

  return deletedEngraver ?? null
}
