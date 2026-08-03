import { rimMutationBodySchema } from "@coin-archive/api"
import type { RimMutationBody } from "@coin-archive/api"

export const createRimInputSchema = rimMutationBodySchema

export type RimFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateRimInput = RimMutationBody
export type UpdateRimInput = RimMutationBody & { id: string; etag: string }
export type DeleteRimInput = { id: string; etag: string }
