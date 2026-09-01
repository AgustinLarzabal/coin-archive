import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapThemeApiProblem } from "./actions"
import type { ThemeMutationResult } from "./theme-mutation-errors"
import {
  THEME_CREATED_MESSAGE,
  THEME_DELETED_MESSAGE,
  THEME_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateThemeInput,
  DeleteThemeInput,
  UpdateThemeInput,
} from "./theme-validation"

type CreateThemeDependencies = {
  createTheme: MaintenanceApiClient["themes"]["create"]
}

type ReplaceThemeDependencies = {
  replaceTheme: MaintenanceApiClient["themes"]["replace"]
}

type DeleteThemeDependencies = {
  deleteTheme: MaintenanceApiClient["themes"]["delete"]
}

export async function submitCreateTheme(
  input: CreateThemeInput & { idempotencyKey: string },
  dependencies?: CreateThemeDependencies
): Promise<ThemeMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...body } = input

  try {
    await (dependencies ?? { createTheme: client!.themes.create }).createTheme({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: THEME_CREATED_MESSAGE }
  } catch (error) {
    return mapThemeApiProblem(error)
  }
}

export async function submitUpdateTheme(
  input: UpdateThemeInput,
  dependencies?: ReplaceThemeDependencies
): Promise<ThemeMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? { replaceTheme: client!.themes.replace }
    ).replaceTheme({
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
  dependencies?: DeleteThemeDependencies
): Promise<ThemeMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteTheme: client!.themes.delete }).deleteTheme({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: THEME_DELETED_MESSAGE }
  } catch (error) {
    return mapThemeApiProblem(error)
  }
}
