import { engraverMutationBodySchema } from "@coin-archive/api"
import type { EngraverMutationBody } from "@coin-archive/api"

export const createEngraverInputSchema = engraverMutationBodySchema

export type EngraverFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateEngraverInput = EngraverMutationBody
export type UpdateEngraverInput = EngraverMutationBody & {
  id: string
  etag: string
}
export type DeleteEngraverInput = { id: string; etag: string }
