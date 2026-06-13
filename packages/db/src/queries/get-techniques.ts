import { asc } from "drizzle-orm"

import { db } from "../client"
import { technique } from "../schema/technique"
import type { Technique } from "../schema/technique"

const getTechniquesSelection = {
  id: technique.id,
  code: technique.code,
  name: technique.name,
  createdAt: technique.createdAt,
  updatedAt: technique.updatedAt,
}

export type TechniqueOption = Pick<
  Technique,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getTechniques(): Promise<TechniqueOption[]> {
  return db
    .select(getTechniquesSelection)
    .from(technique)
    .orderBy(asc(technique.name), asc(technique.code))
}
