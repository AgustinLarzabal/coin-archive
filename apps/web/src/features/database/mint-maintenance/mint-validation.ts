import { mintMutationBodySchema } from "@coin-archive/api"
import type { MintMutationBody } from "@coin-archive/api"

export const createMintInputSchema = mintMutationBodySchema

export type MintFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateMintInput = MintMutationBody
export type UpdateMintInput = MintMutationBody & {
  id: string
  etag: string
}
export type DeleteMintInput = { id: string; etag: string }
