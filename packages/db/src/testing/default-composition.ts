import { eq } from "drizzle-orm"
import { composition, type Composition } from "../schema/composition"

type Database = typeof import("../client").db

export const defaultCompositionValues = {
  code: "copper-nickel",
  name: "Copper-nickel",
  description: null,
} as const

export async function getOrCreateDefaultComposition(
  database: Database
): Promise<Composition> {
  const [existingComposition] = await database
    .select()
    .from(composition)
    .where(eq(composition.code, defaultCompositionValues.code))
    .limit(1)

  if (existingComposition) {
    return existingComposition
  }

  const [createdComposition] = await database
    .insert(composition)
    .values(defaultCompositionValues)
    .returning()

  return createdComposition
}
