import { asc, eq } from "drizzle-orm"

import { db } from "../client"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"

const getRulersSelection = {
  code: ruler.code,
  name: ruler.name,
  groupCode: rulerGroup.code,
  groupName: rulerGroup.name,
}

export type RulerOption = {
  code: string
  name: string
  group: {
    code: string
    name: string
  } | null
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
