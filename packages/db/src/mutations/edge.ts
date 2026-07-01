import { eq } from "drizzle-orm"

import { db } from "../client"
import { edge } from "../schema/edge"
import type { Edge } from "../schema/edge"

type EdgeFields = {
  code: string
  name: string
}

type UpdateEdgeInput = EdgeFields & {
  id: string
}

type DeleteEdgeInput = {
  id: string
}

function normalizeEdgeFields({ code, name }: EdgeFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createEdge(fields: EdgeFields): Promise<Edge> {
  const [createdEdge] = await db
    .insert(edge)
    .values(normalizeEdgeFields(fields))
    .returning()

  return createdEdge
}

export async function updateEdge({
  id,
  ...fields
}: UpdateEdgeInput): Promise<Edge | null> {
  const updatedEdge = (
    await db
      .update(edge)
      .set({
        ...normalizeEdgeFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(edge.id, id))
      .returning()
  ).at(0)

  return updatedEdge ?? null
}

export async function deleteEdge({
  id,
}: DeleteEdgeInput): Promise<Edge | null> {
  const deletedEdge = (
    await db.delete(edge).where(eq(edge.id, id)).returning()
  ).at(0)

  return deletedEdge ?? null
}
