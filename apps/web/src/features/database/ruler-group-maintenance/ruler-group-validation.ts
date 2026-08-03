import { rulerGroupMutationBodySchema } from "@coin-archive/api"
import type { RulerGroupMutationBody } from "@coin-archive/api"

export const createRulerGroupInputSchema = rulerGroupMutationBodySchema

export type RulerGroupFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateRulerGroupInput = RulerGroupMutationBody
export type UpdateRulerGroupInput = RulerGroupMutationBody & {
  id: string
  etag: string
}
export type DeleteRulerGroupInput = { id: string; etag: string }
