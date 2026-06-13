import { asc } from "drizzle-orm"

import { db } from "../client"
import { engraver } from "../schema/engraver"
import type { Engraver } from "../schema/engraver"

const getEngraversSelection = {
  id: engraver.id,
  code: engraver.code,
  name: engraver.name,
  createdAt: engraver.createdAt,
  updatedAt: engraver.updatedAt,
}

export type EngraverOption = Pick<
  Engraver,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getEngravers(): Promise<EngraverOption[]> {
  return db
    .select(getEngraversSelection)
    .from(engraver)
    .orderBy(asc(engraver.name), asc(engraver.code))
}
