import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapCompositionApiProblem } from "./actions"
import { createCompositionFieldErrorResult } from "./composition-mutation-errors"
import type { CompositionMutationResult } from "./composition-mutation-errors"
import {
  COMPOSITION_CREATED_MESSAGE,
  COMPOSITION_DELETED_MESSAGE,
  COMPOSITION_UPDATED_MESSAGE,
} from "./messages"
import {
  createCompositionInputSchema,
  deleteCompositionInputSchema,
  updateCompositionInputSchema,
  validateCompositionInput,
} from "./validation"
import type {
  CreateCompositionInput,
  DeleteCompositionInput,
  UpdateCompositionInput,
} from "./validation"

type CreateCompositionDependencies = {
  createComposition: MaintenanceApiClient["compositions"]["create"]
}

type ReplaceCompositionDependencies = {
  replaceComposition: MaintenanceApiClient["compositions"]["replace"]
}

type DeleteCompositionDependencies = {
  deleteComposition: MaintenanceApiClient["compositions"]["delete"]
}

export async function submitCreateComposition(
  input: CreateCompositionInput & { idempotencyKey: string },
  dependencies?: CreateCompositionDependencies
): Promise<CompositionMutationResult> {
  const { idempotencyKey, ...fields } = input
  const validation = validateCompositionInput(
    createCompositionInputSchema,
    fields
  )
  if (!validation.success) {
    return createCompositionFieldErrorResult(validation.fieldErrors)
  }
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { createComposition: client!.compositions.create }
    ).createComposition({
      headers: { "idempotency-key": idempotencyKey },
      body: validation.data,
    })
    return { status: "success", message: COMPOSITION_CREATED_MESSAGE }
  } catch (error) {
    return mapCompositionApiProblem(error)
  }
}

export async function submitUpdateComposition(
  input: UpdateCompositionInput,
  dependencies?: ReplaceCompositionDependencies
): Promise<CompositionMutationResult> {
  const validation = validateCompositionInput(
    updateCompositionInputSchema,
    input
  )
  if (!validation.success) {
    return createCompositionFieldErrorResult(validation.fieldErrors)
  }
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = validation.data

  try {
    await (
      dependencies ?? { replaceComposition: client!.compositions.replace }
    ).replaceComposition({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: COMPOSITION_UPDATED_MESSAGE }
  } catch (error) {
    return mapCompositionApiProblem(error)
  }
}

export async function submitDeleteComposition(
  input: DeleteCompositionInput,
  dependencies?: DeleteCompositionDependencies
): Promise<CompositionMutationResult> {
  const validation = validateCompositionInput(
    deleteCompositionInputSchema,
    input
  )
  if (!validation.success) {
    return createCompositionFieldErrorResult(validation.fieldErrors)
  }
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { deleteComposition: client!.compositions.delete }
    ).deleteComposition({
      params: { uuid: validation.data.id },
      headers: { "if-match": validation.data.etag },
    })
    return { status: "success", message: COMPOSITION_DELETED_MESSAGE }
  } catch (error) {
    return mapCompositionApiProblem(error)
  }
}
