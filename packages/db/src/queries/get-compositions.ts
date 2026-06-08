import { asc } from "drizzle-orm"

import { db } from "../client"
import { composition } from "../schema/composition"
import type { Composition } from "../schema/composition"

const getCompositionsSelection = {
  createdAt: composition.createdAt,
  code: composition.code,
  description: composition.description,
  id: composition.id,
  name: composition.name,
  updatedAt: composition.updatedAt,
}

export type CompositionOption = Pick<
  Composition,
  "code" | "createdAt" | "description" | "id" | "name" | "updatedAt"
>

export async function getCompositions(): Promise<CompositionOption[]> {
  return db
    .select(getCompositionsSelection)
    .from(composition)
    .orderBy(asc(composition.name), asc(composition.code))
}
