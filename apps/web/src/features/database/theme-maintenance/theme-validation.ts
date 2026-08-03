import { themeMutationBodySchema } from "@coin-archive/api"
import type { ThemeMutationBody } from "@coin-archive/api"

export const createThemeInputSchema = themeMutationBodySchema

export type ThemeFieldErrors = Partial<Record<"code" | "name", string>>
export type CreateThemeInput = ThemeMutationBody
export type UpdateThemeInput = ThemeMutationBody & {
  id: string
  etag: string
}
export type DeleteThemeInput = { id: string; etag: string }
