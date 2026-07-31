import type * as ClientModule from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"
import { getOrCreateDefaultEntity } from "./default-entity"

type Database = typeof ClientModule.db

export const defaultCompositionValues = {
  code: "copper-nickel",
  name: "Copper-nickel",
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
