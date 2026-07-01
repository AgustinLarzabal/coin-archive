import { db } from "../client"
import { issuer } from "../schema/issuer"
import type { Issuer } from "../schema/issuer"

type CreateIssuerFields = {
  code: string
  name: string
  isoCode: string
  parentIssuerId?: string
}

function normalizeParentIssuerId(parentIssuerId?: string) {
  const normalizedParentIssuerId = parentIssuerId?.trim()

  if (
    normalizedParentIssuerId === undefined ||
    normalizedParentIssuerId.length === 0
  ) {
    return undefined
  }

  return normalizedParentIssuerId
}

function normalizeIssuerFields({
  code,
  name,
  isoCode,
  parentIssuerId,
}: CreateIssuerFields) {
  return {
    code: code.trim(),
    name: name.trim(),
    isoCode: isoCode.trim().toUpperCase(),
    parentIssuerId: normalizeParentIssuerId(parentIssuerId),
  }
}

export async function createIssuer(
  fields: CreateIssuerFields
): Promise<Issuer> {
  const [createdIssuer] = await db
    .insert(issuer)
    .values(normalizeIssuerFields(fields))
    .returning()

  return createdIssuer
}
