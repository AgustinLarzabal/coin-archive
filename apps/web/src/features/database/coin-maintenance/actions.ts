import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

export const COIN_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Coins."
export const COIN_GENERIC_SAVE_ERROR = "Unable to save Coin right now."
export const COIN_MISSING_ERROR = "Coin no longer exists."

const COIN_FIELD_NAMES = [
  "title",
  "issuerId",
  "rulerId",
  "distributionId",
  "compositionId",
  "faceValueText",
  "faceValueNumericValue",
  "currencyId",
  "orientationId",
  "shapeId",
  "techniqueId",
  "edgeId",
  "rimId",
  "weight",
  "diameter",
  "thickness",
  "mintage",
  "comments",
  "minYear",
  "maxYear",
  "demonetizationStatus",
] as const

const requiredUuidSchema = z.uuid()
const optionalUuidSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null
  }

  return value
}, z.uuid().nullable())

const optionalTrimmedStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null
  }

  const normalizedValue = value.trim()
  return normalizedValue === "" ? null : normalizedValue
}, z.string().nullable())

const requiredPositiveNumberSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return value
  }

  return Number(value.trim())
}, z.number().positive("Face Value numeric value must be greater than 0."))

const optionalPositiveNumberSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return value
  }

  return Number(value.trim())
}, z.number().positive("Value must be greater than 0.").nullable())

const optionalPositiveIntegerSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return value
  }

  return Number(value.trim())
}, z.number().int("Mintage must be a whole number.").positive("Mintage must be greater than 0.").nullable())

const optionalIntegerSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return value
  }

  return Number(value.trim())
}, z.number().int("Year must be a whole number.").nullable())

const demonetizationStatusSchema = z.enum([
  "unknown",
  "not-demonetized",
  "demonetized",
])

const coinTitleSchema = z
  .string()
  .trim()
  .min(1, "Coin Title cannot be blank.")

const faceValueTextSchema = z
  .string()
  .trim()
  .min(1, "Face Value text cannot be blank.")

export const coinDraftSchema = z
  .object({
    title: coinTitleSchema,
    issuerId: requiredUuidSchema,
    rulerId: requiredUuidSchema,
    distributionId: requiredUuidSchema,
    compositionId: requiredUuidSchema,
    faceValueText: faceValueTextSchema,
    faceValueNumericValue: requiredPositiveNumberSchema,
    currencyId: requiredUuidSchema,
    orientationId: optionalUuidSchema,
    shapeId: optionalUuidSchema,
    techniqueId: optionalUuidSchema,
    edgeId: optionalUuidSchema,
    rimId: optionalUuidSchema,
    weight: optionalPositiveNumberSchema,
    diameter: optionalPositiveNumberSchema,
    thickness: optionalPositiveNumberSchema,
    mintage: optionalPositiveIntegerSchema,
    comments: optionalTrimmedStringSchema,
    minYear: optionalIntegerSchema,
    maxYear: optionalIntegerSchema,
    demonetizationStatus: demonetizationStatusSchema,
  })
  .superRefine((value, ctx) => {
    const hasMinYear = value.minYear !== null
    const hasMaxYear = value.maxYear !== null

    if (hasMinYear !== hasMaxYear) {
      ctx.addIssue({
        code: "custom",
        message: "Issue Year Range requires both years or neither year.",
        path: ["minYear"],
      })
      ctx.addIssue({
        code: "custom",
        message: "Issue Year Range requires both years or neither year.",
        path: ["maxYear"],
      })
    }

    if (
      value.minYear !== null &&
      value.maxYear !== null &&
      value.minYear > value.maxYear
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Earliest Issue Year must be less than or equal to Latest Issue Year.",
        path: ["minYear"],
      })
    }
  })

export const updateCoinInputSchema = coinDraftSchema.extend({
  id: z.uuid(),
})

type CoinFieldName = (typeof COIN_FIELD_NAMES)[number]

export type CoinDraft = z.input<typeof coinDraftSchema>
type CoinDraftData = z.output<typeof coinDraftSchema>
type UpdateCoinInput = z.input<typeof updateCoinInputSchema>
type UpdateCoinData = z.output<typeof updateCoinInputSchema>
type CoinPersistenceInput = Omit<CoinDraftData, "demonetizationStatus"> & {
  isDemonetized: boolean | null
}
type UpdateCoinPersistenceInput = Omit<
  UpdateCoinData,
  "demonetizationStatus"
> & {
  isDemonetized: boolean | null
}

export type CoinFieldErrors = Partial<Record<CoinFieldName, string>>

export type CoinMutationResult =
  | {
      status: "error"
      fieldErrors: CoinFieldErrors
      formError?: string
    }
  | {
      status: "success"
      coinId: string
      message: string
    }

type CoinMutationDependencies = {
  createCoinMaintenance: (input: CoinPersistenceInput) => Promise<{ id: string }>
  updateCoinMaintenance: (
    input: UpdateCoinPersistenceInput
  ) => Promise<{ id: string } | null>
}

async function getDefaultDependencies(): Promise<CoinMutationDependencies> {
  const { createCoinMaintenance, updateCoinMaintenance } =
    await import("@workspace/db")

  return {
    createCoinMaintenance,
    updateCoinMaintenance,
  }
}

function createAuthorizationError(): CoinMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError: COIN_AUTHORIZATION_ERROR,
  }
}

function createFormErrorResult(formError: string): CoinMutationResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

function createFieldErrorResult(fieldErrors: CoinFieldErrors): CoinMutationResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export function hasCoinMaintenanceAccess(
  collector: CollectorWithRole | null
): boolean {
  const role = getCollectorRole(collector)

  return role !== null && hasEditorAccess(role)
}

function isCoinFieldName(field: unknown): field is CoinFieldName {
  return (
    typeof field === "string" &&
    COIN_FIELD_NAMES.includes(field as CoinFieldName)
  )
}

export function getCoinFieldErrors(issues: z.ZodIssue[]): CoinFieldErrors {
  const fieldErrors: CoinFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCoinFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

function validateCoinInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
) {
  const parsedInput = schema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false as const,
      result: createFieldErrorResult(getCoinFieldErrors(parsedInput.error.issues)),
    }
  }

  return {
    success: true as const,
    data: parsedInput.data,
  }
}

function mapDemonetizationStatus(status: CoinDraftData["demonetizationStatus"]) {
  if (status === "unknown") {
    return null
  }

  return status === "demonetized"
}

function mapDraftToPersistenceInput(input: CoinDraftData): CoinPersistenceInput {
  const { demonetizationStatus, ...rest } = input

  return {
    ...rest,
    comments: rest.comments,
    isDemonetized: mapDemonetizationStatus(demonetizationStatus),
  }
}

function getPostgresError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null
  }

  const postgresError = "cause" in error ? error.cause : error

  if (typeof postgresError !== "object" || postgresError === null) {
    return null
  }

  return postgresError
}

function matchesPostgresCode(error: unknown, code: string) {
  const postgresError = getPostgresError(error)
  return postgresError !== null && "code" in postgresError && postgresError.code === code
}

function createPersistenceError(error: unknown): CoinMutationResult {
  if (matchesPostgresCode(error, "23503")) {
    return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
  }

  return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
}

export async function submitCreateCoin(
  collector: CollectorWithRole | null,
  input: CoinDraft,
  dependencies?: CoinMutationDependencies
): Promise<CoinMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCoinInput(coinDraftSchema, input)

  if (!validationResult.success) {
    return validationResult.result
  }

  try {
    const createdCoin = await (
      dependencies ?? (await getDefaultDependencies())
    ).createCoinMaintenance(mapDraftToPersistenceInput(validationResult.data))

    return {
      status: "success",
      coinId: createdCoin.id,
      message: "Coin created.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}

export async function submitUpdateCoin(
  collector: CollectorWithRole | null,
  input: UpdateCoinInput,
  dependencies?: CoinMutationDependencies
): Promise<CoinMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateCoinInput(updateCoinInputSchema, input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const { id, ...draft } = validationResult.data

  try {
    const updatedCoin = await (
      dependencies ?? (await getDefaultDependencies())
    ).updateCoinMaintenance({
      id,
      ...mapDraftToPersistenceInput(draft),
    })

    if (updatedCoin === null) {
      return createFormErrorResult(COIN_MISSING_ERROR)
    }

    return {
      status: "success",
      coinId: updatedCoin.id,
      message: "Saved.",
    }
  } catch (error) {
    return createPersistenceError(error)
  }
}
