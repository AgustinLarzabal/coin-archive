import type { MaintenanceApiClient } from "@coin-archive/api"

import {
  THEME_DUPLICATE_CODE_ERROR,
  THEME_GENERIC_SAVE_ERROR,
  THEME_IN_USE_DELETE_ERROR,
  THEME_MISSING_ERROR,
  THEME_STALE_ERROR,
  createThemeFieldErrorResult,
  createThemeFormErrorResult,
} from "./theme-mutation-errors"
import type { ThemeMutationResult } from "./theme-mutation-errors"
import {
  THEME_AUTHORIZATION_ERROR,
  THEME_CREATED_MESSAGE,
  THEME_DELETED_MESSAGE,
  THEME_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateThemeInput,
  DeleteThemeInput,
  UpdateThemeInput,
} from "./theme-validation"

export { THEME_AUTHORIZATION_ERROR } from "./messages"
export type { ThemeMutationResult } from "./theme-mutation-errors"

export type ThemeAuthorizationErrorResult = {
  status: "error"
  formError: typeof THEME_AUTHORIZATION_ERROR
}

type CreateDependencies = {
  createTheme: MaintenanceApiClient["themes"]["create"]
}

type ReplaceDependencies = {
  replaceTheme: MaintenanceApiClient["themes"]["replace"]
}

type DeleteDependencies = {
  deleteTheme: MaintenanceApiClient["themes"]["delete"]
}

export function createThemeAuthorizationError(): ThemeAuthorizationErrorResult {
  return { status: "error", formError: THEME_AUTHORIZATION_ERROR }
}

async function getDefaultCreateDependencies(): Promise<CreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createTheme: client.themes.create,
  }
}

async function getDefaultReplaceDependencies(): Promise<ReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { replaceTheme: client.themes.replace }
}

async function getDefaultDeleteDependencies(): Promise<DeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return { deleteTheme: client.themes.delete }
}

export async function submitCreateTheme(
  input: CreateThemeInput & { idempotencyKey: string },
  dependencies?: CreateDependencies
): Promise<ThemeMutationResult> {
  const { idempotencyKey, ...fields } = input
  const resolved = dependencies ?? (await getDefaultCreateDependencies())

  try {
    await resolved.createTheme({
      headers: { "idempotency-key": idempotencyKey },
      body: fields,
    })
    return { status: "success", message: THEME_CREATED_MESSAGE }
  } catch (error) {
    return mapThemeApiProblem(error)
  }
}

export async function submitUpdateTheme(
  input: UpdateThemeInput,
  dependencies?: ReplaceDependencies
): Promise<ThemeMutationResult> {
  const resolved = dependencies ?? (await getDefaultReplaceDependencies())
  const { id, etag, ...body } = input

  try {
    await resolved.replaceTheme({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: THEME_UPDATED_MESSAGE }
  } catch (error) {
    return mapThemeApiProblem(error)
  }
}

export async function submitDeleteTheme(
  input: DeleteThemeInput,
  dependencies?: DeleteDependencies
): Promise<ThemeMutationResult> {
  const resolved = dependencies ?? (await getDefaultDeleteDependencies())

  try {
    await resolved.deleteTheme({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: THEME_DELETED_MESSAGE }
  } catch (error) {
    return mapThemeApiProblem(error)
  }
}

function mapThemeApiProblem(error: unknown): ThemeMutationResult {
  const body = getProblemBody(error)
  switch (body?.code) {
    case "authentication_required":
    case "editor_access_required":
      return createThemeFormErrorResult(THEME_AUTHORIZATION_ERROR)
    case "theme_code_conflict":
      return createThemeFieldErrorResult({
        code: THEME_DUPLICATE_CODE_ERROR,
      })
    case "theme_validation_failed":
      return mapValidationProblem(body)
    case "theme_in_use":
      return createThemeFormErrorResult(THEME_IN_USE_DELETE_ERROR)
    case "theme_not_found":
      return createThemeFormErrorResult(THEME_MISSING_ERROR)
    case "theme_precondition_failed":
      return createThemeFormErrorResult(THEME_STALE_ERROR)
    default:
      return createThemeFormErrorResult(THEME_GENERIC_SAVE_ERROR)
  }
}

function mapValidationProblem(
  body: Record<string, unknown>
): ThemeMutationResult {
  const invalidParams = Array.isArray(body.invalidParams)
    ? body.invalidParams
    : []
  const fieldErrors: { code?: string; name?: string } = {}

  for (const parameter of invalidParams) {
    if (typeof parameter !== "object" || parameter === null) continue
    if (!("name" in parameter) || !("code" in parameter)) continue
    if (parameter.name === "/code") {
      fieldErrors.code =
        parameter.code === "theme_code_too_long"
          ? "Theme Code must be 255 characters or fewer."
          : parameter.code === "theme_code_invalid"
            ? "Theme Code must use lowercase letters, numbers, and single hyphens only."
            : "Theme Code cannot be blank."
    }
    if (parameter.name === "/name") {
      fieldErrors.name =
        parameter.code === "theme_name_too_long"
          ? "Theme Name must be 255 characters or fewer."
          : "Theme Name cannot be blank."
    }
  }
  return createThemeFieldErrorResult(fieldErrors)
}

function getProblemBody(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data)) {
    return undefined
  }
  return typeof data.body === "object" && data.body !== null
    ? (data.body as Record<string, unknown>)
    : undefined
}
