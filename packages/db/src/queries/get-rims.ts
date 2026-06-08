import { asc } from "drizzle-orm"

import { db } from "../client"
import { rim } from "../schema/rim"
import type { Rim } from "../schema/rim"

const getRimsSelection = {
  createdAt: rim.createdAt,
  code: rim.code,
  id: rim.id,
  name: rim.name,
  updatedAt: rim.updatedAt,
}

export type RimOption = Pick<
  Rim,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getRims(): Promise<RimOption[]> {
  return db.select(getRimsSelection).from(rim).orderBy(asc(rim.name), asc(rim.code))
}
