import { asc, eq } from "drizzle-orm"

import { db } from "../client"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import type { Ruler } from "../schema/ruler"
import type { RulerGroup } from "../schema/ruler-group"

const getRulersSelection = {
  id: ruler.id,
  code: ruler.code,
  name: ruler.name,
  groupId: rulerGroup.id,
  groupCode: rulerGroup.code,
  groupName: rulerGroup.name,
}

type RulerGroupOption = Pick<RulerGroup, "id" | "code" | "name">

export type RulerOption = Pick<Ruler, "id" | "code" | "name"> & {
  group: RulerGroupOption | null
}

function buildRulerGroupOption(
  groupId: string | null,
  groupCode: string | null,
  groupName: string | null
): RulerOption["group"] {
  if (groupId === null || groupCode === null || groupName === null) {
    return null
  }

  return {
    id: groupId,
    code: groupCode,
    name: groupName,
  }
}

export async function getRulers(): Promise<RulerOption[]> {
  const rows = await db
    .select(getRulersSelection)
    .from(ruler)
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .orderBy(asc(ruler.name), asc(ruler.code))

  return rows.map(({ id, code, name, groupId, groupCode, groupName }) => ({
    id,
    code,
    name,
    group: buildRulerGroupOption(groupId, groupCode, groupName),
  }))
}
