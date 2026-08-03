import { z } from "zod"

import { MINT_INVALID_CODE_ERROR } from "./messages"

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

export type MintFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateMintInput = z.input<typeof createMintInputSchema>
export type UpdateMintInput = CreateMintInput & {
  id: string
  etag: string
}
export type DeleteMintInput = { id: string; etag: string }
