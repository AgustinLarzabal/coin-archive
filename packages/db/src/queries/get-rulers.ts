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

export async function getRulers(): Promise<RulerOption[]> {
  const rows = await db
    .select(getRulersSelection)
    .from(ruler)
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .orderBy(asc(ruler.name), asc(ruler.code))

  return rows.map(({ code, name, groupCode, groupName }) => ({
    code,
    name,
    group:
      groupCode && groupName
        ? {
            code: groupCode,
            name: groupName,
          }
        : null,
  }))
}
