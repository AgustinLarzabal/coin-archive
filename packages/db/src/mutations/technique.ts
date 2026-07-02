import { eq } from "drizzle-orm"

import { db } from "../client"
import { technique } from "../schema/technique"
import type { Technique } from "../schema/technique"

type TechniqueFields = {
  code: string
  name: string
}

type UpdateTechniqueInput = TechniqueFields & {
  id: string
}

function normalizeTechniqueFields({ code, name }: TechniqueFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createTechnique(
  fields: TechniqueFields
): Promise<Technique> {
  const [createdTechnique] = await db
    .insert(technique)
    .values(normalizeTechniqueFields(fields))
    .returning()

  return createdTechnique
}

export async function updateTechnique({
  id,
  ...fields
}: UpdateTechniqueInput): Promise<Technique | null> {
  const updatedTechnique = (
    await db
      .update(technique)
      .set({
        ...normalizeTechniqueFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(technique.id, id))
      .returning()
  ).at(0)

  return updatedTechnique ?? null
}
