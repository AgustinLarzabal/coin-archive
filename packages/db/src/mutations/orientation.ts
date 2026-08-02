import { eq, sql } from "drizzle-orm"

import { db } from "../client"
import { orientation } from "../schema/orientation"
import type { Orientation } from "../schema/orientation"

type OrientationFields = {
  code: string
  name: string
}

type UpdateOrientationInput = OrientationFields & {
  id: string
}

type DeleteOrientationInput = {
  id: string
}

function takeFirstOrNull<T>(records: T[]): T | null {
  return records.at(0) ?? null
}

function normalizeOrientationFields({ code, name }: OrientationFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createOrientation(
  fields: OrientationFields
): Promise<Orientation> {
  const [createdOrientation] = await db
    .insert(orientation)
    .values(normalizeOrientationFields(fields))
    .returning()

  return createdOrientation
}

export async function updateOrientation({
  id,
  ...fields
}: UpdateOrientationInput): Promise<Orientation | null> {
  return takeFirstOrNull(
    await db
      .update(orientation)
      .set({
        ...normalizeOrientationFields(fields),
        updatedAt: new Date(),
        version: sql`${orientation.version} + 1`,
      })
      .where(eq(orientation.id, id))
      .returning()
  )
}

export async function deleteOrientation({
  id,
}: DeleteOrientationInput): Promise<Orientation | null> {
  return takeFirstOrNull(
    await db.delete(orientation).where(eq(orientation.id, id)).returning()
  )
}
