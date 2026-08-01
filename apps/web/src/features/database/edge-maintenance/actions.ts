import { hasEditorAccess } from "@coin-archive/auth/client"
import type { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  EDGE_MISSING_ERROR,
  createEdgeFieldErrorResult,
  createEdgeFormErrorResult,
  createEdgePersistenceError,
} from "./edge-mutation-errors"
import type { EdgeMutationResult } from "./edge-mutation-errors"
import {
  createEdgeInputSchema,
  deleteEdgeInputSchema,
  updateEdgeInputSchema,
  validateEdgeInput,
} from "./edge-validation"
import type {
  CreateEdgeData,
  CreateEdgeInput,
  DeleteEdgeData,
  DeleteEdgeInput,
  UpdateEdgeData,
  UpdateEdgeInput,
} from "./edge-validation"

export const EDGE_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Edges."
export type EdgeAuthorizationErrorResult = {
  status: "error"
  formError: typeof EDGE_AUTHORIZATION_ERROR
}
type EdgeMutationDependencies = {
  createEdge: (input: CreateEdgeData) => Promise<unknown>
  deleteEdge: (input: DeleteEdgeData) => Promise<unknown | null>
  updateEdge: (input: UpdateEdgeData) => Promise<unknown | null>
}

async function getDefaultEdgeMutationDependencies(): Promise<EdgeMutationDependencies> {
  const { createEdge, deleteEdge, updateEdge } =
    await import("@coin-archive/db")
  return { createEdge, deleteEdge, updateEdge }
}
export function createEdgeAuthorizationError(): EdgeAuthorizationErrorResult {
  return { status: "error", formError: EDGE_AUTHORIZATION_ERROR }
}
export function hasEdgeMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)
  return role !== null && hasEditorAccess(role)
}

async function submitEdgeMutation<TSchema extends z.ZodType>({
  collector,
  input,
  dependencies,
  schema,
  execute,
  successMessage,
  missingOnNull,
}: {
  collector: CollectorWithRole | null
  input: z.input<TSchema>
  dependencies?: EdgeMutationDependencies
  schema: TSchema
  execute: (
    dependencies: EdgeMutationDependencies,
    data: z.output<TSchema>
  ) => Promise<unknown | null>
  successMessage: string
  missingOnNull?: boolean
}): Promise<EdgeMutationResult> {
  if (!hasEdgeMaintenanceAccess(collector)) {
    return { ...createEdgeAuthorizationError(), fieldErrors: {} }
  }
  const validationResult = validateEdgeInput(schema, input)
  if (!validationResult.success) {
    return createEdgeFieldErrorResult(validationResult.fieldErrors)
  }
  const resolvedDependencies =
    dependencies ?? (await getDefaultEdgeMutationDependencies())
  try {
    const result = await execute(resolvedDependencies, validationResult.data)
    return result === null && missingOnNull
      ? createEdgeFormErrorResult(EDGE_MISSING_ERROR)
      : { status: "success", message: successMessage }
  } catch (error) {
    return createEdgePersistenceError(error)
  }
}

export async function submitCreateEdge(
  collector: CollectorWithRole | null,
  input: CreateEdgeInput,
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationResult> {
  return submitEdgeMutation({
    collector,
    input,
    dependencies,
    schema: createEdgeInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createEdge(data),
    successMessage: "Edge added.",
  })
}
export async function submitUpdateEdge(
  collector: CollectorWithRole | null,
  input: UpdateEdgeInput,
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationResult> {
  return submitEdgeMutation({
    collector,
    input,
    dependencies,
    schema: updateEdgeInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateEdge(data),
    successMessage: "Saved.",
    missingOnNull: true,
  })
}
export async function submitDeleteEdge(
  collector: CollectorWithRole | null,
  input: DeleteEdgeInput,
  dependencies?: EdgeMutationDependencies
): Promise<EdgeMutationResult> {
  return submitEdgeMutation({
    collector,
    input,
    dependencies,
    schema: deleteEdgeInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteEdge(data),
    successMessage: "Edge deleted.",
    missingOnNull: true,
  })
}
