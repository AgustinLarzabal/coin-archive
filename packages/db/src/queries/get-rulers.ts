import { asc, eq } from "drizzle-orm"

import { db } from "../client"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import type { Ruler } from "../schema/ruler"
import type { RulerGroup } from "../schema/ruler-group"

const getRulersSelection = {
  code: ruler.code,
  name: ruler.name,
  groupCode: rulerGroup.code,
  groupName: rulerGroup.name,
}

type RulerGroupOption = Pick<RulerGroup, "code" | "name">

export type RulerOption = Pick<Ruler, "code" | "name"> & {
  group: RulerGroupOption | null
}

function buildRulerGroupOption(
  groupCode: string | null,
  groupName: string | null
): RulerOption["group"] {
  if (groupCode === null || groupName === null) {
    return null
  }

  return {
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

  return rows.map(({ code, name, groupCode, groupName }) => ({
    code,
    name,
    group: buildRulerGroupOption(groupCode, groupName),
  }))
}
