import { z } from "zod"

const CATALOGUE_FIELD_NAMES = ["code", "title"] as const

const catalogueCodeSchema = z
  .string()
  .trim()
  .min(1, "Catalogue Code cannot be blank.")
  .max(255, "Catalogue Code must be 255 characters or fewer.")

const catalogueTitleSchema = z
  .string()
  .trim()
  .min(1, "Catalogue Title cannot be blank.")
  .max(255, "Catalogue Title must be 255 characters or fewer.")

export const createCatalogueInputSchema = z.object({
  code: catalogueCodeSchema,
  title: catalogueTitleSchema,
})

export const updateCatalogueInputSchema = createCatalogueInputSchema.extend({
  id: z.uuid(),
})

export const deleteCatalogueInputSchema = z.object({
  id: z.uuid(),
})

type CatalogueFieldName = (typeof CATALOGUE_FIELD_NAMES)[number]

export type CatalogueFieldErrors = Partial<Record<CatalogueFieldName, string>>
export type CreateCatalogueInput = z.input<typeof createCatalogueInputSchema>
export type CreateCatalogueData = z.output<typeof createCatalogueInputSchema>
export type UpdateCatalogueInput = z.input<typeof updateCatalogueInputSchema>
export type UpdateCatalogueData = z.output<typeof updateCatalogueInputSchema>
export type DeleteCatalogueInput = z.input<typeof deleteCatalogueInputSchema>
export type DeleteCatalogueData = z.output<typeof deleteCatalogueInputSchema>

function isCatalogueFieldName(field: unknown): field is CatalogueFieldName {
  return (
    typeof field === "string" &&
    CATALOGUE_FIELD_NAMES.includes(field as CatalogueFieldName)
  )
}

function getCatalogueFieldErrors(issues: z.ZodIssue[]): CatalogueFieldErrors {
  const fieldErrors: CatalogueFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCatalogueFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function validateCatalogueInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: CatalogueFieldErrors } {
  const parsedInput = schema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false,
      fieldErrors: getCatalogueFieldErrors(parsedInput.error.issues),
    }
  }

  return {
    success: true,
    data: parsedInput.data,
  }
}
