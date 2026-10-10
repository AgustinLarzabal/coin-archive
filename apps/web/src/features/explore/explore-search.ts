import { issuerCodeSchema } from "@workspace/api"
import { z } from "zod"

export const exploreSearchSchema = z.object({
  issuer: issuerCodeSchema.optional().catch(undefined),
})

export type ExploreSearch = z.infer<typeof exploreSearchSchema>
