import { asc } from "drizzle-orm"

import { db } from "../client"
import { shape } from "../schema/shape"
import type { Shape } from "../schema/shape"

const getShapesSelection = {
  createdAt: shape.createdAt,
  code: shape.code,
  id: shape.id,
  name: shape.name,
  updatedAt: shape.updatedAt,
}

export type ShapeOption = Pick<
  Shape,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getShapes(): Promise<ShapeOption[]> {
  return db
    .select(getShapesSelection)
    .from(shape)
    .orderBy(asc(shape.name), asc(shape.code))
}
