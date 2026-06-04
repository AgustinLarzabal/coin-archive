import { asc } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import type { Catalogue } from "../schema/catalogue"

const getCataloguesSelection = {
  code: catalogue.code,
  title: catalogue.title,
}

export type CatalogueOption = Pick<Catalogue, "code" | "title">

export async function getCatalogues(): Promise<CatalogueOption[]> {
  return db
    .select(getCataloguesSelection)
    .from(catalogue)
    .orderBy(asc(catalogue.title), asc(catalogue.code))
}
