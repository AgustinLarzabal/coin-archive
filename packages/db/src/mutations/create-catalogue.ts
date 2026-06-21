import { db } from "../client"
import { catalogue } from "../schema/catalogue"

type CreateCatalogueInput = {
  code: string
  title: string
}

export async function createCatalogue({ code, title }: CreateCatalogueInput) {
  const [createdCatalogue] = await db
    .insert(catalogue)
    .values({
      code: code.trim(),
      title: title.trim(),
    })
    .returning()

  return createdCatalogue
}
