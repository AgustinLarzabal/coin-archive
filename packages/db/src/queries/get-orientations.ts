import { asc } from "drizzle-orm"

import { db } from "../client"
import { orientation } from "../schema/orientation"
import type { Orientation } from "../schema/orientation"

const getOrientationsSelection = {
  createdAt: orientation.createdAt,
  code: orientation.code,
  id: orientation.id,
  name: orientation.name,
  updatedAt: orientation.updatedAt,
}

export type OrientationOption = Pick<
  Orientation,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getOrientations(): Promise<OrientationOption[]> {
  return db
    .select(getOrientationsSelection)
    .from(orientation)
    .orderBy(asc(orientation.name), asc(orientation.code))
}
