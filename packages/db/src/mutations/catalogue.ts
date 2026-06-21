import { eq } from "drizzle-orm"

import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import type { Catalogue } from "../schema/catalogue"

type CatalogueFields = {
  code: string
  title: string
}

type UpdateCatalogueInput = CatalogueFields & {
  id: string
}

function trimCatalogueFields({ code, title }: CatalogueFields) {
  return {
    code: code.trim(),
    title: title.trim(),
  }
}

export async function createCatalogue(
  fields: CatalogueFields
): Promise<Catalogue> {
  const [createdCatalogue] = await db
    .insert(catalogue)
    .values(trimCatalogueFields(fields))
    .returning()

  return createdCatalogue
}

export async function updateCatalogue({
  id,
  ...fields
}: UpdateCatalogueInput): Promise<Catalogue | null> {
  const [updatedCatalogue] = await db
    .update(catalogue)
    .set({
      ...trimCatalogueFields(fields),
      updatedAt: new Date(),
    })
    .where(eq(catalogue.id, id))
    .returning()

  return updatedCatalogue ?? null
}
