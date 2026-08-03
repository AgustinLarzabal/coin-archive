import { mintingTechniqueMutationBodySchema } from "@coin-archive/api"
import type { MintingTechniqueMutationBody } from "@coin-archive/api"

export const createMintingTechniqueInputSchema =
  mintingTechniqueMutationBodySchema

export type MintingTechniqueFieldErrors = Partial<
  Record<"code" | "name", string>
>
export type CreateMintingTechniqueInput = MintingTechniqueMutationBody
export type UpdateMintingTechniqueInput = MintingTechniqueMutationBody & {
  id: string
  etag: string
}
export type DeleteMintingTechniqueInput = { id: string; etag: string }
