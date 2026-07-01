import { db } from "../client"
import { issuer } from "../schema/issuer"
import type { Issuer } from "../schema/issuer"

type IssuerFields = {
  code: string
  name: string
  isoCode: string
  parentIssuerId?: string
}

function normalizeIssuerFields({
  code,
  name,
  isoCode,
  parentIssuerId,
}: IssuerFields) {
  const normalizedParentIssuerId = parentIssuerId?.trim()

  return {
    code: code.trim(),
    name: name.trim(),
    isoCode: isoCode.trim().toUpperCase(),
    parentIssuerId:
      normalizedParentIssuerId && normalizedParentIssuerId.length > 0
        ? normalizedParentIssuerId
        : undefined,
  }
}

export async function createIssuer(fields: IssuerFields): Promise<Issuer> {
  const [createdIssuer] = await db
    .insert(issuer)
    .values(normalizeIssuerFields(fields))
    .returning()

  return createdIssuer
}
