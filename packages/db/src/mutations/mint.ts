import { eq } from "drizzle-orm"

import { db } from "../client"
import { mint } from "../schema/mint"
import type { Mint } from "../schema/mint"

type MintFields = {
  code: string
  name: string
}

type UpdateMintInput = MintFields & {
  id: string
}

type DeleteMintInput = {
  id: string
}

function takeFirstOrNull<T>(records: T[]): T | null {
  return records.at(0) ?? null
}

function normalizeMintFields({ code, name }: MintFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createMint(fields: MintFields): Promise<Mint> {
  const [createdMint] = await db
    .insert(mint)
    .values(normalizeMintFields(fields))
    .returning()

  return createdMint
}

export async function updateMint({
  id,
  ...fields
}: UpdateMintInput): Promise<Mint | null> {
  return takeFirstOrNull(
    await db
      .update(mint)
      .set({
        ...normalizeMintFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(mint.id, id))
      .returning()
  )
}

export async function deleteMint({ id }: DeleteMintInput): Promise<Mint | null> {
  return takeFirstOrNull(
    await db.delete(mint).where(eq(mint.id, id)).returning()
  )
}
