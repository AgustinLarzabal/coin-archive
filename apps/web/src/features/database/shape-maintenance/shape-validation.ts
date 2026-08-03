import { shapeMutationBodySchema } from "@coin-archive/api"
import type { ShapeMutationBody } from "@coin-archive/api"

export const createShapeInputSchema = shapeMutationBodySchema

export type ShapeFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateShapeInput = ShapeMutationBody
export type UpdateShapeInput = ShapeMutationBody & { id: string; etag: string }
export type DeleteShapeInput = { id: string; etag: string }
