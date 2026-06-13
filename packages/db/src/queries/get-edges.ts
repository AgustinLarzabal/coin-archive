import { asc } from "drizzle-orm"

import { db } from "../client"
import { edge } from "../schema/edge"
import type { Edge } from "../schema/edge"

const getEdgesSelection = {
  id: edge.id,
  code: edge.code,
  name: edge.name,
  createdAt: edge.createdAt,
  updatedAt: edge.updatedAt,
}

export type EdgeOption = Pick<
  Edge,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getEdges(): Promise<EdgeOption[]> {
  return db
    .select(getEdgesSelection)
    .from(edge)
    .orderBy(asc(edge.name), asc(edge.code))
}
