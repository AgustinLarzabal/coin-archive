import { asc } from "drizzle-orm"

import { db } from "../client"
import { mint } from "../schema/mint"
import type { Mint } from "../schema/mint"

const getMintsSelection = {
  id: mint.id,
  code: mint.code,
  name: mint.name,
  createdAt: mint.createdAt,
  updatedAt: mint.updatedAt,
}

export type MintOption = Pick<
  Mint,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getMints(): Promise<MintOption[]> {
  return db
    .select(getMintsSelection)
    .from(mint)
    .orderBy(asc(mint.name), asc(mint.code))
}
