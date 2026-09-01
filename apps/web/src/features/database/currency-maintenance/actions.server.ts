import type { MaintenanceApiClient } from "@coin-archive/api"

import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

import { mapCurrencyApiProblem } from "./actions"
import type { CurrencyMutationResult } from "./currency-mutation-errors"
import {
  CURRENCY_CREATED_MESSAGE,
  CURRENCY_DELETED_MESSAGE,
  CURRENCY_UPDATED_MESSAGE,
} from "./messages"
import type {
  CreateCurrencyInput,
  DeleteCurrencyInput,
  UpdateCurrencyInput,
} from "./validation"

type CreateCurrencyDependencies = {
  createCurrency: MaintenanceApiClient["currencies"]["create"]
}

type ReplaceCurrencyDependencies = {
  replaceCurrency: MaintenanceApiClient["currencies"]["replace"]
}

type DeleteCurrencyDependencies = {
  deleteCurrency: MaintenanceApiClient["currencies"]["delete"]
}

export async function submitCreateCurrency(
  input: CreateCurrencyInput & { idempotencyKey: string },
  dependencies?: CreateCurrencyDependencies
): Promise<CurrencyMutationResult> {
  const { idempotencyKey, ...body } = input
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { createCurrency: client!.currencies.create }
    ).createCurrency({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    return { status: "success", message: CURRENCY_CREATED_MESSAGE }
  } catch (error) {
    return mapCurrencyApiProblem(error)
  }
}

export async function submitUpdateCurrency(
  input: UpdateCurrencyInput,
  dependencies?: ReplaceCurrencyDependencies
): Promise<CurrencyMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()
  const { id, etag, ...body } = input

  try {
    await (
      dependencies ?? { replaceCurrency: client!.currencies.replace }
    ).replaceCurrency({
      params: { uuid: id },
      headers: { "if-match": etag },
      body,
    })
    return { status: "success", message: CURRENCY_UPDATED_MESSAGE }
  } catch (error) {
    return mapCurrencyApiProblem(error)
  }
}

export async function submitDeleteCurrency(
  input: DeleteCurrencyInput,
  dependencies?: DeleteCurrencyDependencies
): Promise<CurrencyMutationResult> {
  const client = dependencies ? null : await getMaintenanceApiClient()

  try {
    await (
      dependencies ?? { deleteCurrency: client!.currencies.delete }
    ).deleteCurrency({
      params: { uuid: input.id },
      headers: { "if-match": input.etag },
    })
    return { status: "success", message: CURRENCY_DELETED_MESSAGE }
  } catch (error) {
    return mapCurrencyApiProblem(error)
  }
}
