import type { ThemeFieldErrors } from "./theme-validation"

export {
  THEME_DUPLICATE_CODE_ERROR,
  THEME_GENERIC_SAVE_ERROR,
  THEME_IN_USE_DELETE_ERROR,
  THEME_MISSING_ERROR,
} from "./messages"
export const THEME_STALE_ERROR =
  "Theme changed after you opened it. Reload it before trying again."

export type ThemeMutationResult =
  | {
      status: "error"
      fieldErrors: ThemeFieldErrors
      formError?: string
    }
  | {
      status: "success"
      message: string
    }

export function createThemeFieldErrorResult(
  fieldErrors: ThemeFieldErrors
): ThemeMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function createThemeFormErrorResult(
  formError: string
): ThemeMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}
