import { db } from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"

type CreateCompositionInput = {
  code: string
  name: string
  description?: string | null
}

function normalizeDescription(description?: string | null) {
  const trimmedDescription = description?.trim()

  if (!trimmedDescription) {
    return null
  }

  return trimmedDescription
}

function normalizeCompositionFields({
  code,
  name,
  description,
}: CreateCompositionInput) {
  return {
    code: code.trim(),
    name: name.trim(),
    description: normalizeDescription(description),
  }
}

export async function createComposition(
  fields: CreateCompositionInput
): Promise<Composition> {
  const [createdComposition] = await db
    .insert(composition)
    .values(normalizeCompositionFields(fields))
    .returning()

  return createdComposition
}
