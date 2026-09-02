import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapMintApiProblem } from "./actions"
import type { MintMutationResult } from "./mint-mutation-errors"
import {
  MINT_CREATED_MESSAGE,
  MINT_DELETED_MESSAGE,
  MINT_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateMintInput,
  DeleteMintInput,
  UpdateMintInput,
} from "./mint-validation"

type CreateMintDependencies = {
  createMint: MaintenanceApiClient["mints"]["create"]
}

type ReplaceMintDependencies = {
  replaceMint: MaintenanceApiClient["mints"]["replace"]
}

type DeleteMintDependencies = {
  deleteMint: MaintenanceApiClient["mints"]["delete"]
}

export async function submitCreateMint(
  input: CreateMintInput & { idempotencyKey: string },
  dependencies?: CreateMintDependencies
): Promise<MintMutationResult> {
  const { idempotencyKey, ...body } = input
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { createMint: client!.mints.create }).createMint({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: MINT_CREATED_MESSAGE }
  } catch (error) {
    return mapMintApiProblem(error)
  }
}

export async function submitUpdateMint(
  input: UpdateMintInput,
  dependencies?: ReplaceMintDependencies
): Promise<MintMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (dependencies ?? { replaceMint: client!.mints.replace }).replaceMint({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: MINT_UPDATED_MESSAGE }
  } catch (error) {
    return mapMintApiProblem(error)
  }
}

export async function submitDeleteMint(
  input: DeleteMintInput,
  dependencies?: DeleteMintDependencies
): Promise<MintMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteMint: client!.mints.delete }).deleteMint({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: MINT_DELETED_MESSAGE }
  } catch (error) {
    return mapMintApiProblem(error)
  }
}
