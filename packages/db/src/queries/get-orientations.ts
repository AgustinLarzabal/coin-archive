import { asc } from "drizzle-orm"

import { db } from "../client"
import { orientation } from "../schema/orientation"
import type { Orientation } from "../schema/orientation"

const getOrientationsSelection = {
  id: orientation.id,
  code: orientation.code,
  name: orientation.name,
  createdAt: orientation.createdAt,
  updatedAt: orientation.updatedAt,
}

export type OrientationOption = Pick<
  Orientation,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getOrientations(): Promise<OrientationOption[]> {
  return db
    .select(getOrientationsSelection)
    .from(orientation)
    .orderBy(asc(orientation.name), asc(orientation.code))
}
