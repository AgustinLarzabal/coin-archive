import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapMintingTechniqueApiProblem } from "./actions"
import type { MintingTechniqueMutationResult } from "./minting-technique-mutation-errors"
import {
  MINTING_TECHNIQUE_CREATED_MESSAGE,
  MINTING_TECHNIQUE_DELETED_MESSAGE,
  MINTING_TECHNIQUE_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateMintingTechniqueInput,
  DeleteMintingTechniqueInput,
  UpdateMintingTechniqueInput,
} from "./minting-technique-validation"

type CreateMintingTechniqueDependencies = {
  createMintingTechnique: MaintenanceApiClient["mintingTechniques"]["create"]
}

type ReplaceMintingTechniqueDependencies = {
  replaceMintingTechnique: MaintenanceApiClient["mintingTechniques"]["replace"]
}

type DeleteMintingTechniqueDependencies = {
  deleteMintingTechnique: MaintenanceApiClient["mintingTechniques"]["delete"]
}

export async function submitCreateMintingTechnique(
  input: CreateMintingTechniqueInput & { idempotencyKey: string },
  dependencies?: CreateMintingTechniqueDependencies
): Promise<MintingTechniqueMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { idempotencyKey, ...body } = input

  try {
    await (
      dependencies ?? {
        createMintingTechnique: client!.mintingTechniques.create,
      }
    ).createMintingTechnique({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: MINTING_TECHNIQUE_CREATED_MESSAGE }
  } catch (error) {
    return mapMintingTechniqueApiProblem(error)
  }
}

export async function submitUpdateMintingTechnique(
  input: UpdateMintingTechniqueInput,
  dependencies?: ReplaceMintingTechniqueDependencies
): Promise<MintingTechniqueMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? {
        replaceMintingTechnique: client!.mintingTechniques.replace,
      }
    ).replaceMintingTechnique({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: MINTING_TECHNIQUE_UPDATED_MESSAGE }
  } catch (error) {
    return mapMintingTechniqueApiProblem(error)
  }
}

export async function submitDeleteMintingTechnique(
  input: DeleteMintingTechniqueInput,
  dependencies?: DeleteMintingTechniqueDependencies
): Promise<MintingTechniqueMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? {
        deleteMintingTechnique: client!.mintingTechniques.delete,
      }
    ).deleteMintingTechnique({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: MINTING_TECHNIQUE_DELETED_MESSAGE }
  } catch (error) {
    return mapMintingTechniqueApiProblem(error)
  }
}
