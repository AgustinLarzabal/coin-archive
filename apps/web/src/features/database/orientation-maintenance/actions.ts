import { hasEditorAccess } from "@coin-archive/auth/client"
import type { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  ORIENTATION_MISSING_ERROR,
  createOrientationFieldErrorResult,
  createOrientationFormErrorResult,
  createOrientationPersistenceError,
} from "./orientation-mutation-errors"
import type { OrientationMutationResult } from "./orientation-mutation-errors"
import {
  createOrientationInputSchema,
  deleteOrientationInputSchema,
  updateOrientationInputSchema,
  validateOrientationInput,
} from "./orientation-validation"
import type {
  CreateOrientationData,
  CreateOrientationInput,
  DeleteOrientationData,
  DeleteOrientationInput,
  UpdateOrientationData,
  UpdateOrientationInput,
} from "./orientation-validation"

export const ORIENTATION_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Orientations."

export type OrientationAuthorizationErrorResult = {
  status: "error"
  formError: typeof ORIENTATION_AUTHORIZATION_ERROR
}

type OrientationMutationDependencies = {
  createOrientation: (input: CreateOrientationData) => Promise<unknown>
  deleteOrientation: (input: DeleteOrientationData) => Promise<unknown | null>
  updateOrientation: (input: UpdateOrientationData) => Promise<unknown | null>
}

async function getDefaultOrientationMutationDependencies(): Promise<OrientationMutationDependencies> {
  const { createOrientation, deleteOrientation, updateOrientation } =
    await import("@coin-archive/db")

  return { createOrientation, deleteOrientation, updateOrientation }
}

export function createOrientationAuthorizationError(): OrientationAuthorizationErrorResult {
  return { status: "error", formError: ORIENTATION_AUTHORIZATION_ERROR }
}

export function hasOrientationMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

async function submitOrientationMutation<TSchema extends z.ZodType>({
  collector,
  input,
  dependencies,
  schema,
  execute,
  successMessage,
}: {
  collector: CollectorWithRole | null
  input: z.input<TSchema>
  dependencies?: OrientationMutationDependencies
  schema: TSchema
  execute: (
    dependencies: OrientationMutationDependencies,
    data: z.output<TSchema>
  ) => Promise<unknown | null>
  successMessage: string
}): Promise<OrientationMutationResult> {
  if (!hasOrientationMaintenanceAccess(collector)) {
    return {
      ...createOrientationAuthorizationError(),
      fieldErrors: {},
    }
  }

  const validationResult = validateOrientationInput(schema, input)

  if (!validationResult.success) {
    return createOrientationFieldErrorResult(validationResult.fieldErrors)
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultOrientationMutationDependencies())

  try {
    const result = await execute(resolvedDependencies, validationResult.data)

    return result === null
      ? createOrientationFormErrorResult(ORIENTATION_MISSING_ERROR)
      : { status: "success", message: successMessage }
  } catch (error) {
    return createOrientationPersistenceError(error)
  }
}

export async function submitCreateOrientation(
  collector: CollectorWithRole | null,
  input: CreateOrientationInput,
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationResult> {
  return submitOrientationMutation({
    collector,
    input,
    dependencies,
    schema: createOrientationInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createOrientation(data),
    successMessage: "Orientation added.",
  })
}

export async function submitUpdateOrientation(
  collector: CollectorWithRole | null,
  input: UpdateOrientationInput,
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationResult> {
  return submitOrientationMutation({
    collector,
    input,
    dependencies,
    schema: updateOrientationInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateOrientation(data),
    successMessage: "Saved.",
  })
}

export async function submitDeleteOrientation(
  collector: CollectorWithRole | null,
  input: DeleteOrientationInput,
  dependencies?: OrientationMutationDependencies
): Promise<OrientationMutationResult> {
  return submitOrientationMutation({
    collector,
    input,
    dependencies,
    schema: deleteOrientationInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteOrientation(data),
    successMessage: "Orientation deleted.",
  })
}
