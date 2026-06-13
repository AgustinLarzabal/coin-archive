import { asc } from "drizzle-orm"

import { db } from "../client"
import { shape } from "../schema/shape"
import type { Shape } from "../schema/shape"

const getShapesSelection = {
  id: shape.id,
  code: shape.code,
  name: shape.name,
  createdAt: shape.createdAt,
  updatedAt: shape.updatedAt,
}

export type ShapeOption = Pick<
  Shape,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getShapes(): Promise<ShapeOption[]> {
  return db
    .select(getShapesSelection)
    .from(shape)
    .orderBy(asc(shape.name), asc(shape.code))
}
