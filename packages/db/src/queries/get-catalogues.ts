import { asc } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import type { Catalogue } from "../schema/catalogue"

const getCataloguesSelection = {
  createdAt: catalogue.createdAt,
  code: catalogue.code,
  id: catalogue.id,
  title: catalogue.title,
  updatedAt: catalogue.updatedAt,
}

export type CatalogueOption = Pick<
  Catalogue,
  "code" | "createdAt" | "id" | "title" | "updatedAt"
>

export async function getCatalogues(): Promise<CatalogueOption[]> {
  return db
    .select(getCataloguesSelection)
    .from(catalogue)
    .orderBy(asc(catalogue.title), asc(catalogue.code))
}
