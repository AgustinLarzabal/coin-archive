import { asc } from "drizzle-orm"

import { db } from "../client"
import { technique } from "../schema/technique"
import type { Technique } from "../schema/technique"

const getTechniquesSelection = {
  createdAt: technique.createdAt,
  code: technique.code,
  id: technique.id,
  name: technique.name,
  updatedAt: technique.updatedAt,
}

export type TechniqueOption = Pick<
  Technique,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getTechniques(): Promise<TechniqueOption[]> {
  return db
    .select(getTechniquesSelection)
    .from(technique)
    .orderBy(asc(technique.name), asc(technique.code))
}
