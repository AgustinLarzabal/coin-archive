import { asc } from "drizzle-orm"

import { db } from "../client"
import { rulerGroup } from "../schema/ruler-group"
import type { RulerGroup } from "../schema/ruler-group"

const getRulerGroupsSelection = {
  id: rulerGroup.id,
  code: rulerGroup.code,
  name: rulerGroup.name,
  createdAt: rulerGroup.createdAt,
  updatedAt: rulerGroup.updatedAt,
}

export type RulerGroupOption = Pick<
  RulerGroup,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getRulerGroups(): Promise<RulerGroupOption[]> {
  return db
    .select(getRulerGroupsSelection)
    .from(rulerGroup)
    .orderBy(asc(rulerGroup.name), asc(rulerGroup.code))
}
