import { asc } from "drizzle-orm"

import { db } from "../client"
import { engraver } from "../schema/engraver"
import type { Engraver } from "../schema/engraver"

const getEngraversSelection = {
  createdAt: engraver.createdAt,
  code: engraver.code,
  id: engraver.id,
  name: engraver.name,
  updatedAt: engraver.updatedAt,
}

export type EngraverOption = Pick<
  Engraver,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getEngravers(): Promise<EngraverOption[]> {
  return db
    .select(getEngraversSelection)
    .from(engraver)
    .orderBy(asc(engraver.name), asc(engraver.code))
}
