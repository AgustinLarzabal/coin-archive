import { asc } from "drizzle-orm"

import { db } from "../client"
import { mint } from "../schema/mint"
import type { Mint } from "../schema/mint"

const getMintsSelection = {
  createdAt: mint.createdAt,
  code: mint.code,
  id: mint.id,
  name: mint.name,
  updatedAt: mint.updatedAt,
}

export type MintOption = Pick<
  Mint,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getMints(): Promise<MintOption[]> {
  return db
    .select(getMintsSelection)
    .from(mint)
    .orderBy(asc(mint.name), asc(mint.code))
}
