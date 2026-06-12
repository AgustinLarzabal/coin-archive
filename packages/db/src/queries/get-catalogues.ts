import { asc } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import type { Catalogue } from "../schema/catalogue"

const getCataloguesSelection = {
  id: catalogue.id,
  code: catalogue.code,
  title: catalogue.title,
  createdAt: catalogue.createdAt,
  updatedAt: catalogue.updatedAt,
}

export type CatalogueOption = Pick<
  Catalogue,
  "id" | "code" | "title" | "createdAt" | "updatedAt"
>

export async function getCatalogues(): Promise<CatalogueOption[]> {
  return db
    .select(getCataloguesSelection)
    .from(catalogue)
    .orderBy(asc(catalogue.title), asc(catalogue.code))
}
