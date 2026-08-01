import { hasEditorAccess } from "@coin-archive/auth/client"
import type { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  MINT_MISSING_ERROR,
  createMintFieldErrorResult,
  createMintFormErrorResult,
  createMintPersistenceError,
} from "./mint-mutation-errors"
import type { MintMutationResult } from "./mint-mutation-errors"
import {
  createMintInputSchema,
  deleteMintInputSchema,
  updateMintInputSchema,
  validateMintInput,
} from "./mint-validation"
import type {
  CreateMintData,
  CreateMintInput,
  DeleteMintData,
  DeleteMintInput,
  UpdateMintData,
  UpdateMintInput,
} from "./mint-validation"

export const MINT_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Mints."

export type MintAuthorizationErrorResult = {
  status: "error"
  formError: typeof MINT_AUTHORIZATION_ERROR
}

type MintMutationDependencies = {
  createMint: (input: CreateMintData) => Promise<unknown>
  deleteMint: (input: DeleteMintData) => Promise<unknown | null>
  updateMint: (input: UpdateMintData) => Promise<unknown | null>
}

async function getDefaultMintMutationDependencies(): Promise<MintMutationDependencies> {
  const { createMint, deleteMint, updateMint } =
    await import("@coin-archive/db")
  return { createMint, deleteMint, updateMint }
}

export function createMintAuthorizationError(): MintAuthorizationErrorResult {
  return { status: "error", formError: MINT_AUTHORIZATION_ERROR }
}

export function hasMintMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)
  return role !== null && hasEditorAccess(role)
}

async function submitMintMutation<TSchema extends z.ZodType>({
  collector,
  input,
  dependencies,
  schema,
  execute,
  successMessage,
}: {
  collector: CollectorWithRole | null
  input: z.input<TSchema>
  dependencies?: MintMutationDependencies
  schema: TSchema
  execute: (
    dependencies: MintMutationDependencies,
    data: z.output<TSchema>
  ) => Promise<unknown | null>
  successMessage: string
}): Promise<MintMutationResult> {
  if (!hasMintMaintenanceAccess(collector)) {
    return { ...createMintAuthorizationError(), fieldErrors: {} }
  }

  const validationResult = validateMintInput(schema, input)
  if (!validationResult.success) {
    return createMintFieldErrorResult(validationResult.fieldErrors)
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultMintMutationDependencies())

  try {
    const result = await execute(resolvedDependencies, validationResult.data)
    return result === null
      ? createMintFormErrorResult(MINT_MISSING_ERROR)
      : { status: "success", message: successMessage }
  } catch (error) {
    return createMintPersistenceError(error)
  }
}

export async function submitCreateMint(
  collector: CollectorWithRole | null,
  input: CreateMintInput,
  dependencies?: MintMutationDependencies
): Promise<MintMutationResult> {
  return submitMintMutation({
    collector,
    input,
    dependencies,
    schema: createMintInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.createMint(data),
    successMessage: "Mint added.",
  })
}

export async function submitUpdateMint(
  collector: CollectorWithRole | null,
  input: UpdateMintInput,
  dependencies?: MintMutationDependencies
): Promise<MintMutationResult> {
  return submitMintMutation({
    collector,
    input,
    dependencies,
    schema: updateMintInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.updateMint(data),
    successMessage: "Saved.",
  })
}

export async function submitDeleteMint(
  collector: CollectorWithRole | null,
  input: DeleteMintInput,
  dependencies?: MintMutationDependencies
): Promise<MintMutationResult> {
  return submitMintMutation({
    collector,
    input,
    dependencies,
    schema: deleteMintInputSchema,
    execute: (resolvedDependencies, data) =>
      resolvedDependencies.deleteMint(data),
    successMessage: "Mint deleted.",
  })
}
