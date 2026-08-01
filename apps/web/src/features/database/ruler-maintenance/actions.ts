import { hasEditorAccess } from "@coin-archive/auth/client"
import type { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  RULER_MISSING_ERROR,
  createRulerFieldErrorResult,
  createRulerFormErrorResult,
  createRulerPersistenceError,
} from "./ruler-mutation-errors"
import type { RulerMutationResult } from "./ruler-mutation-errors"
import {
  createRulerInputSchema,
  deleteRulerInputSchema,
  updateRulerInputSchema,
  validateRulerInput,
} from "./ruler-validation"
import type {
  CreateRulerData,
  CreateRulerInput,
  DeleteRulerData,
  DeleteRulerInput,
  UpdateRulerData,
  UpdateRulerInput,
} from "./ruler-validation"

export const RULER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Rulers."
export type RulerAuthorizationErrorResult = {
  status: "error"
  formError: typeof RULER_AUTHORIZATION_ERROR
}
type RulerMutationDependencies = {
  createRuler: (input: CreateRulerData) => Promise<unknown>
  deleteRuler: (input: DeleteRulerData) => Promise<unknown | null>
  updateRuler: (input: UpdateRulerData) => Promise<unknown | null>
}

async function getDefaultRulerMutationDependencies(): Promise<RulerMutationDependencies> {
  const { createRuler, deleteRuler, updateRuler } =
    await import("@coin-archive/db")
  return { createRuler, deleteRuler, updateRuler }
}
export function createRulerAuthorizationError(): RulerAuthorizationErrorResult {
  return { status: "error", formError: RULER_AUTHORIZATION_ERROR }
}
export function hasRulerMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)
  return role !== null && hasEditorAccess(role)
}

async function submitRulerMutation<TSchema extends z.ZodType>({
  collector,
  input,
  dependencies,
  schema,
  execute,
  successMessage,
}: {
  collector: CollectorWithRole | null
  input: z.input<TSchema>
  dependencies?: RulerMutationDependencies
  schema: TSchema
  execute: (
    dependencies: RulerMutationDependencies,
    data: z.output<TSchema>
  ) => Promise<unknown | null>
  successMessage: string
}): Promise<RulerMutationResult> {
  if (!hasRulerMaintenanceAccess(collector)) {
    return { ...createRulerAuthorizationError(), fieldErrors: {} }
  }
  const validationResult = validateRulerInput(schema, input)
  if (!validationResult.success) {
    return createRulerFieldErrorResult(validationResult.fieldErrors)
  }
  const resolvedDependencies =
    dependencies ?? (await getDefaultRulerMutationDependencies())
  try {
    const result = await execute(resolvedDependencies, validationResult.data)
    return result === null
      ? createRulerFormErrorResult(RULER_MISSING_ERROR)
      : { status: "success", message: successMessage }
  } catch (error) {
    return createRulerPersistenceError(error)
  }
}

export async function submitCreateRuler(
  collector: CollectorWithRole | null,
  input: CreateRulerInput,
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationResult> {
  return submitRulerMutation({
    collector,
    input,
    dependencies,
    schema: createRulerInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createRuler(data),
    successMessage: "Ruler added.",
  })
}
export async function submitUpdateRuler(
  collector: CollectorWithRole | null,
  input: UpdateRulerInput,
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationResult> {
  return submitRulerMutation({
    collector,
    input,
    dependencies,
    schema: updateRulerInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateRuler(data),
    successMessage: "Saved.",
  })
}
export async function submitDeleteRuler(
  collector: CollectorWithRole | null,
  input: DeleteRulerInput,
  dependencies?: RulerMutationDependencies
): Promise<RulerMutationResult> {
  return submitRulerMutation({
    collector,
    input,
    dependencies,
    schema: deleteRulerInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteRuler(data),
    successMessage: "Ruler deleted.",
  })
}
