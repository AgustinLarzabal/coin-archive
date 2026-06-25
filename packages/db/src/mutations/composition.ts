import { db } from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"

type CreateCompositionInput = {
  code: string
  name: string
  description?: string | null
}

function trimOrNull(value?: string | null) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  return trimmedValue
}

function normalizeCompositionFields({
  code,
  name,
  description,
}: CreateCompositionInput) {
  return {
    code: code.trim(),
    name: name.trim(),
    description: trimOrNull(description),
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
