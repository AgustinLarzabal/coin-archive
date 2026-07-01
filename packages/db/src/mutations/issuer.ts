import { eq } from "drizzle-orm"

import { db } from "../client"
import { issuer } from "../schema/issuer"
import type { Issuer } from "../schema/issuer"

type IssuerFields = {
  code: string
  isoCode: string
  name: string
  parentIssuerId: string | null
}

type UpdateIssuerInput = IssuerFields & {
  id: string
}

type DeleteIssuerInput = {
  id: string
}

function normalizeParentIssuerId(parentIssuerId: string | null) {
  const normalizedParentIssuerId = parentIssuerId?.trim()

  if (
    normalizedParentIssuerId === undefined ||
    normalizedParentIssuerId.length === 0
  ) {
    return null
  }

  return normalizedParentIssuerId
}

function normalizeIssuerFields({
  code,
  isoCode,
  name,
  parentIssuerId,
}: IssuerFields) {
  return {
    code: code.trim(),
    isoCode: isoCode.trim().toUpperCase(),
    name: name.trim(),
    parentIssuerId: normalizeParentIssuerId(parentIssuerId),
  }
}

export async function createIssuer(fields: IssuerFields): Promise<Issuer> {
  const [createdIssuer] = await db
    .insert(issuer)
    .values(normalizeIssuerFields(fields))
    .returning()

  return createdIssuer
}

export async function updateIssuer({
  id,
  ...fields
}: UpdateIssuerInput): Promise<Issuer | null> {
  const updatedIssuer = (
    await db
      .update(issuer)
      .set({
        ...normalizeIssuerFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(issuer.id, id))
      .returning()
  ).at(0)

  return updatedIssuer ?? null
}

export async function deleteIssuer({
  id,
}: DeleteIssuerInput): Promise<Issuer | null> {
  const deletedIssuer = (
    await db.delete(issuer).where(eq(issuer.id, id)).returning()
  ).at(0)

  return deletedIssuer ?? null
}
