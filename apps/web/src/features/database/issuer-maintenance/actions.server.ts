import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapIssuerApiProblem } from "./actions"
import type { IssuerMutationResult } from "./issuer-mutation-errors"
import {
  ISSUER_CREATED_MESSAGE,
  ISSUER_DELETED_MESSAGE,
  ISSUER_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateIssuerInput,
  DeleteIssuerInput,
  UpdateIssuerInput,
} from "./validation"

type CreateIssuerDependencies = {
  createIssuer: MaintenanceApiClient["issuers"]["create"]
}

type ReplaceIssuerDependencies = {
  replaceIssuer: MaintenanceApiClient["issuers"]["replace"]
}

type DeleteIssuerDependencies = {
  deleteIssuer: MaintenanceApiClient["issuers"]["delete"]
}

export async function submitCreateIssuer(
  input: CreateIssuerInput & { idempotencyKey: string },
  dependencies?: CreateIssuerDependencies
): Promise<IssuerMutationResult> {
  const { idempotencyKey, ...body } = input
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { createIssuer: client!.issuers.create }).createIssuer({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: ISSUER_CREATED_MESSAGE }
  } catch (error) {
    return mapIssuerApiProblem(error)
  }
}

export async function submitUpdateIssuer(
  input: UpdateIssuerInput,
  dependencies?: ReplaceIssuerDependencies
): Promise<IssuerMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (dependencies ?? { replaceIssuer: client!.issuers.replace }).replaceIssuer({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: ISSUER_UPDATED_MESSAGE }
  } catch (error) {
    return mapIssuerApiProblem(error)
  }
}

export async function submitDeleteIssuer(
  input: DeleteIssuerInput,
  dependencies?: DeleteIssuerDependencies
): Promise<IssuerMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (dependencies ?? { deleteIssuer: client!.issuers.delete }).deleteIssuer({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: ISSUER_DELETED_MESSAGE }
  } catch (error) {
    return mapIssuerApiProblem(error)
  }
}
