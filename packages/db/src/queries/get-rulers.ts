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
  createdAt: ruler.createdAt,
  updatedAt: ruler.updatedAt,
  groupId: rulerGroup.id,
  groupCode: rulerGroup.code,
  groupName: rulerGroup.name,
  groupCreatedAt: rulerGroup.createdAt,
  groupUpdatedAt: rulerGroup.updatedAt,
}

type RulerGroupOption = Pick<
  RulerGroup,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export type RulerOption = Pick<
  Ruler,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
> & {
  group: RulerGroupOption | null
}

function buildRulerGroupOption(
  groupId: string | null,
  groupCode: string | null,
  groupName: string | null,
  groupCreatedAt: Date | null,
  groupUpdatedAt: Date | null
): RulerOption["group"] {
  if (
    groupId === null ||
    groupCode === null ||
    groupName === null ||
    groupCreatedAt === null ||
    groupUpdatedAt === null
  ) {
    return null
  }

  return {
    id: groupId,
    code: groupCode,
    name: groupName,
    createdAt: groupCreatedAt,
    updatedAt: groupUpdatedAt,
  }
}

export async function getRulers(): Promise<RulerOption[]> {
  const rows = await db
    .select(getRulersSelection)
    .from(ruler)
    .leftJoin(rulerGroup, eq(ruler.rulerGroupId, rulerGroup.id))
    .orderBy(asc(ruler.name), asc(ruler.code))

  return rows.map(
    ({
      id,
      code,
      name,
      createdAt,
      updatedAt,
      groupId,
      groupCode,
      groupName,
      groupCreatedAt,
      groupUpdatedAt,
    }) => ({
      id,
      code,
      name,
      createdAt,
      updatedAt,
      group: buildRulerGroupOption(
        groupId,
        groupCode,
        groupName,
        groupCreatedAt,
        groupUpdatedAt
      ),
    })
  )
}
