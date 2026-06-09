import { asc } from "drizzle-orm"

import { db } from "../client"
import { edge } from "../schema/edge"
import type { Edge } from "../schema/edge"

const getEdgesSelection = {
  createdAt: edge.createdAt,
  code: edge.code,
  id: edge.id,
  name: edge.name,
  updatedAt: edge.updatedAt,
}

export type EdgeOption = Pick<
  Edge,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getEdges(): Promise<EdgeOption[]> {
  return db
    .select(getEdgesSelection)
    .from(edge)
    .orderBy(asc(edge.name), asc(edge.code))
}
