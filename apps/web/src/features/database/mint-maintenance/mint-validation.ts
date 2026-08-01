import { z } from "zod"

import { MINT_INVALID_CODE_ERROR } from "./mint-mutation-errors"

const MINT_FIELD_NAMES = ["code", "name"] as const

const mintCodeSchema = z
  .string()
  .trim()
  .min(1, "Mint Code cannot be blank.")
  .max(255, "Mint Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, MINT_INVALID_CODE_ERROR)

const mintNameSchema = z
  .string()
  .trim()
  .min(1, "Mint Name cannot be blank.")
  .max(255, "Mint Name must be 255 characters or fewer.")

export const createMintInputSchema = z.object({
  code: mintCodeSchema,
  name: mintNameSchema,
})
export const updateMintInputSchema = createMintInputSchema.extend({
  id: z.uuid(),
})
export const deleteMintInputSchema = z.object({ id: z.uuid() })

type MintFieldName = (typeof MINT_FIELD_NAMES)[number]

export type MintFieldErrors = Partial<Record<MintFieldName, string>>
export type CreateMintInput = z.input<typeof createMintInputSchema>
export type CreateMintData = z.output<typeof createMintInputSchema>
export type UpdateMintInput = z.input<typeof updateMintInputSchema>
export type UpdateMintData = z.output<typeof updateMintInputSchema>
export type DeleteMintInput = z.input<typeof deleteMintInputSchema>
export type DeleteMintData = z.output<typeof deleteMintInputSchema>

function getMintFieldErrors(issues: z.ZodIssue[]): MintFieldErrors {
  const fieldErrors: MintFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (
      typeof field === "string" &&
      MINT_FIELD_NAMES.includes(field as MintFieldName)
    ) {
      fieldErrors[field as MintFieldName] = issue.message
    }
  }

  return fieldErrors
}

export function validateMintInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: MintFieldErrors } {
  const parsedInput = schema.safeParse(input)

  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getMintFieldErrors(parsedInput.error.issues),
      }
}
