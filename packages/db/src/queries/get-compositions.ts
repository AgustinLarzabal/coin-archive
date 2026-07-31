import { asc } from "drizzle-orm"

import { db } from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"

const getCompositionsSelection = {
  id: composition.id,
  code: composition.code,
  name: composition.name,
  createdAt: composition.createdAt,
  updatedAt: composition.updatedAt,
}

export type CompositionOption = Pick<
  Composition,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getCompositions(): Promise<CompositionOption[]> {
  return db
    .select(getCompositionsSelection)
    .from(composition)
    .orderBy(asc(composition.name), asc(composition.code))
}
