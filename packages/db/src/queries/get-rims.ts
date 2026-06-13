import { asc } from "drizzle-orm"

import { db } from "../client"
import { rim } from "../schema/rim"
import type { Rim } from "../schema/rim"

const getRimsSelection = {
  id: rim.id,
  code: rim.code,
  name: rim.name,
  createdAt: rim.createdAt,
  updatedAt: rim.updatedAt,
}

export type RimOption = Pick<
  Rim,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getRims(): Promise<RimOption[]> {
  return db
    .select(getRimsSelection)
    .from(rim)
    .orderBy(asc(rim.name), asc(rim.code))
}
