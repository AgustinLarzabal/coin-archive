import { composition, type Composition } from "../schema/composition"
import { getOrCreateDefaultEntity } from "./default-entity"

type Database = typeof import("../client").db

export const defaultCompositionValues = {
  code: "copper-nickel",
  name: "Copper-nickel",
  description: null,
} as const

export async function getOrCreateDefaultComposition(
  database: Database
): Promise<Composition> {
  return getOrCreateDefaultEntity(
    database,
    composition,
    composition.code,
    defaultCompositionValues
  )
}
