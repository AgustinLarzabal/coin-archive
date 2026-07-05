import { hasEditorAccess } from "@workspace/auth/client"
import { z } from "zod"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"
import type { CoinMaintenanceDeleteSummary } from "@workspace/db"

export const COIN_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Coins."
export const COIN_GENERIC_SAVE_ERROR = "Unable to save Coin right now."
export const COIN_MISSING_ERROR = "Coin no longer exists."
export const COIN_DELETE_CONFIRMATION_ERROR =
  "Enter the current Coin Title exactly to confirm deletion."
const DUPLICATE_REFERENCE_ERROR =
  "Duplicate Catalogue References are not allowed on the same Coin."
const DUPLICATE_ENGRAVER_ERROR =
  "Duplicate Engraver Attributions are not allowed on the same face."
const SURFACE_IMAGE_URL_ERROR =
  "Surface Image URL must be an absolute http:// or https:// URL."
const SURFACE_THUMBNAIL_URL_ERROR =
  "Surface Thumbnail URL must be an absolute http:// or https:// URL."

const COIN_FIELD_NAMES = [
  "title",
  "issuerId",
  "rulers",
  "distributionId",
  "compositionId",
  "faceValueText",
  "faceValueNumericValue",
  "currencyId",
  "mints",
  "orientationId",
  "shapeId",
  "techniqueId",
  "edgeId",
  "rimId",
  "themes",
  "weight",
  "diameter",
  "thickness",
  "mintage",
  "comments",
  "minYear",
  "maxYear",
  "demonetizationStatus",
  "references",
  "surfaces",
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

const coinTitleSchema = z.string().trim().min(1, "Coin Title cannot be blank.")

const faceValueTextSchema = z
  .string()
  .trim()
  .min(1, "Face Value text cannot be blank.")

const attributionRowUuidSchema = z.uuid("Select a valid lookup record.")

const rulerAttributionSchema = z.object({
  rulerId: attributionRowUuidSchema,
})

const mintAttributionSchema = z.object({
  mintId: attributionRowUuidSchema,
})

const themeAttributionSchema = z.object({
  themeId: attributionRowUuidSchema,
})

const optionalAbsoluteWebUrlSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null
  }

  const normalizedValue = value.trim()
  return normalizedValue === "" ? null : normalizedValue
}, z.string().url().refine((value) => /^https?:\/\//i.test(value)).nullable())

const referenceSchema = z.object({
  catalogueId: z.uuid(),
  number: z.string().trim().min(1, "Reference Number cannot be blank."),
})

const faceSurfaceSchema = z.object({
  description: optionalTrimmedStringSchema,
  lettering: optionalTrimmedStringSchema,
  thumbnailUrl: optionalAbsoluteWebUrlSchema,
  imageUrl: optionalAbsoluteWebUrlSchema,
  engraverIds: z.array(z.uuid()),
})

const edgeSurfaceSchema = z.object({
  description: optionalTrimmedStringSchema,
  lettering: optionalTrimmedStringSchema,
  thumbnailUrl: optionalAbsoluteWebUrlSchema,
  imageUrl: optionalAbsoluteWebUrlSchema,
})

type DuplicateCollectionIssueInput<TFieldName extends string> = {
  fieldName: TFieldName
  items: Array<Record<TFieldName, string>>
  message: string
  pathPrefix: string
}

function addDuplicateCollectionIssues<TFieldName extends string>(
  {
    items,
    fieldName,
    message,
    pathPrefix,
  }: DuplicateCollectionIssueInput<TFieldName>,
  ctx: z.RefinementCtx
) {
  const seenValues = new Set<string>()

  for (const [index, item] of items.entries()) {
    const value = item[fieldName]

    if (!seenValues.has(value)) {
      seenValues.add(value)
      continue
    }

    ctx.addIssue({
      code: "custom",
      message,
      path: [pathPrefix, index, fieldName],
    })
  }
}

function normalizeReferenceNumber(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function addDuplicateReferenceIssues(
  references: Array<{ catalogueId: string; number: string }>,
  ctx: z.RefinementCtx
) {
  const seen = new Map<string, number>()

  references.forEach((reference, index) => {
    const key = `${reference.catalogueId}:${normalizeReferenceNumber(reference.number)}`
    const previousIndex = seen.get(key)

    if (previousIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: DUPLICATE_REFERENCE_ERROR,
        path: ["references", index, "number"],
      })
      return
    }

    seen.set(key, index)
  })
}

function addDuplicateEngraverIssues(
  engraverIds: string[],
  path: ["surfaces", "obverse" | "reverse", "engraverIds"],
  ctx: z.RefinementCtx
) {
  const seen = new Set<string>()

  engraverIds.forEach((engraverId, index) => {
    if (seen.has(engraverId)) {
      ctx.addIssue({
        code: "custom",
        message: DUPLICATE_ENGRAVER_ERROR,
        path: [...path, index],
      })
      return
    }

    seen.add(engraverId)
  })
}

type CoinDraftValidationData = {
  minYear: number | null
  maxYear: number | null
  rulers: Array<{ rulerId: string }>
  mints: Array<{ mintId: string }>
  themes: Array<{ themeId: string }>
  references: Array<{ catalogueId: string; number: string }>
  surfaces: {
    obverse: { engraverIds: string[] }
    reverse: { engraverIds: string[] }
  }
}

function addCoinDraftIssues(
  value: CoinDraftValidationData,
  ctx: z.RefinementCtx
) {
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
      message:
        "Earliest Issue Year must be less than or equal to Latest Issue Year.",
      path: ["minYear"],
    })
  }

  addDuplicateCollectionIssues(
    {
      items: value.rulers,
      fieldName: "rulerId",
      message: "Ruler Attribution duplicates another row.",
      pathPrefix: "rulers",
    },
    ctx
  )
  addDuplicateCollectionIssues(
    {
      items: value.mints,
      fieldName: "mintId",
      message: "Mint Attribution duplicates another row.",
      pathPrefix: "mints",
    },
    ctx
  )
  addDuplicateCollectionIssues(
    {
      items: value.themes,
      fieldName: "themeId",
      message: "Theme Attribution duplicates another row.",
      pathPrefix: "themes",
    },
    ctx
  )
  addDuplicateReferenceIssues(value.references, ctx)
  addDuplicateEngraverIssues(
    value.surfaces.obverse.engraverIds,
    ["surfaces", "obverse", "engraverIds"],
    ctx
  )
  addDuplicateEngraverIssues(
    value.surfaces.reverse.engraverIds,
    ["surfaces", "reverse", "engraverIds"],
    ctx
  )
}

function mapAttributionIds<TFieldName extends string>(
  items: Array<Record<TFieldName, string>>,
  fieldName: TFieldName
) {
  return items.map((item) => item[fieldName])
}

export const coinDraftSchema = z
  .object({
    title: coinTitleSchema,
    issuerId: requiredUuidSchema,
    rulers: z
      .array(rulerAttributionSchema)
      .min(1, "At least one Ruler Attribution is required."),
    distributionId: requiredUuidSchema,
    compositionId: requiredUuidSchema,
    faceValueText: faceValueTextSchema,
    faceValueNumericValue: requiredPositiveNumberSchema,
    currencyId: requiredUuidSchema,
    mints: z.array(mintAttributionSchema),
    orientationId: optionalUuidSchema,
    shapeId: optionalUuidSchema,
    techniqueId: optionalUuidSchema,
    edgeId: optionalUuidSchema,
    rimId: optionalUuidSchema,
    themes: z.array(themeAttributionSchema),
    weight: optionalPositiveNumberSchema,
    diameter: optionalPositiveNumberSchema,
    thickness: optionalPositiveNumberSchema,
    mintage: optionalPositiveIntegerSchema,
    comments: optionalTrimmedStringSchema,
    minYear: optionalIntegerSchema,
    maxYear: optionalIntegerSchema,
    demonetizationStatus: demonetizationStatusSchema,
    references: z.array(referenceSchema),
    surfaces: z.object({
      obverse: faceSurfaceSchema,
      reverse: faceSurfaceSchema,
      edge: edgeSurfaceSchema,
    }),
  })
  .superRefine(addCoinDraftIssues)

export const updateCoinInputSchema = coinDraftSchema.extend({
  id: z.uuid(),
})
export const deleteCoinInputSchema = z.object({
  id: z.uuid(),
  confirmationTitle: z.string(),
})

type CoinFieldName = (typeof COIN_FIELD_NAMES)[number]

export type CoinDraft = z.input<typeof coinDraftSchema>
export type CoinReferenceDraft = z.input<typeof referenceSchema>
export type CoinFaceSurfaceDraft = z.input<typeof faceSurfaceSchema>
export type CoinEdgeSurfaceDraft = z.input<typeof edgeSurfaceSchema>
type CoinDraftData = z.output<typeof coinDraftSchema>
type UpdateCoinInput = z.input<typeof updateCoinInputSchema>
type UpdateCoinData = z.output<typeof updateCoinInputSchema>
type DeleteCoinInput = z.input<typeof deleteCoinInputSchema>
type CoinPersistenceInput = Omit<
  CoinDraftData,
  "demonetizationStatus" | "rulers" | "mints" | "themes" | "surfaces"
> & {
  isDemonetized: boolean | null
  mintIds: string[]
  rulerIds: string[]
  themeIds: string[]
  surfaces: {
    obverse: z.output<typeof faceSurfaceSchema> | null
    reverse: z.output<typeof faceSurfaceSchema> | null
    edge: z.output<typeof edgeSurfaceSchema> | null
  }
}
type UpdateCoinPersistenceInput = Omit<
  UpdateCoinData,
  "demonetizationStatus" | "rulers" | "mints" | "themes" | "surfaces"
> & {
  isDemonetized: boolean | null
  mintIds: string[]
  rulerIds: string[]
  themeIds: string[]
  surfaces: {
    obverse: z.output<typeof faceSurfaceSchema> | null
    reverse: z.output<typeof faceSurfaceSchema> | null
    edge: z.output<typeof edgeSurfaceSchema> | null
  }
}

export type CoinFieldErrors = Partial<Record<string, string>>

type CoinMutationErrorResult = {
  status: "error"
  fieldErrors: CoinFieldErrors
  formError?: string
}

export type CoinMutationResult =
  | CoinMutationErrorResult
  | {
      status: "success"
      coinId: string
      message: string
    }

export type CoinDeleteMutationResult =
  | CoinMutationErrorResult
  | {
      status: "success"
      message: string
      redirectTo: "/database/coins"
    }

type CoinMutationDependencies = {
  createCoinMaintenance: (
    input: CoinPersistenceInput
  ) => Promise<{ id: string }>
  updateCoinMaintenance: (
    input: UpdateCoinPersistenceInput
  ) => Promise<{ id: string } | null>
}

type CoinDeleteDependencies = {
  deleteCoinMaintenance: (input: { id: string }) => Promise<{ id: string } | null>
  getCoinMaintenanceDeleteSummary: (
    coinId: string
  ) => Promise<CoinMaintenanceDeleteSummary | null>
}

async function getDefaultDependencies(): Promise<CoinMutationDependencies> {
  const { createCoinMaintenance, updateCoinMaintenance } =
    await import("@workspace/db")

  return {
    createCoinMaintenance,
    updateCoinMaintenance,
  }
}

async function getDefaultDeleteDependencies(): Promise<CoinDeleteDependencies> {
  const { deleteCoinMaintenance, getCoinMaintenanceDeleteSummary } =
    await import("@workspace/db")

  return {
    deleteCoinMaintenance,
    getCoinMaintenanceDeleteSummary,
  }
}

function createAuthorizationError(): CoinMutationResult {
  return createFormErrorResult(COIN_AUTHORIZATION_ERROR)
}

function createFormErrorResult(formError: string): CoinMutationErrorResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

function createFieldErrorResult(
  fieldErrors: CoinFieldErrors
): CoinMutationErrorResult {
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

function getIssueMessage(issue: z.ZodIssue) {
  const pathString = issue.path.join(".")

  if (
    issue.path.at(-1) === "imageUrl" &&
    pathString.startsWith("surfaces.")
  ) {
    return SURFACE_IMAGE_URL_ERROR
  }

  if (
    issue.path.at(-1) === "thumbnailUrl" &&
    pathString.startsWith("surfaces.")
  ) {
    return SURFACE_THUMBNAIL_URL_ERROR
  }

  return issue.message
}

export function getCoinFieldErrors(issues: z.ZodIssue[]): CoinFieldErrors {
  const fieldErrors: CoinFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)
    const pathKey = issue.path.join(".")

    if (pathKey !== "" && fieldErrors[pathKey] === undefined) {
      fieldErrors[pathKey] = getIssueMessage(issue)
      continue
    }

    if (isCoinFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = getIssueMessage(issue)
    }
  }

  return fieldErrors
}

function validateInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
) {
  const parsedInput = schema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false as const,
      result: createFieldErrorResult(
        getCoinFieldErrors(parsedInput.error.issues)
      ),
    }
  }

  return {
    success: true as const,
    data: parsedInput.data,
  }
}

function mapDemonetizationStatus(
  status: CoinDraftData["demonetizationStatus"]
) {
  if (status === "unknown") {
    return null
  }

  return status === "demonetized"
}

function mapDraftToPersistenceInput(
  input: CoinDraftData
): CoinPersistenceInput {
  const { demonetizationStatus, mints, rulers, themes, ...rest } = input

  function mapFaceSurface(surface: z.output<typeof faceSurfaceSchema>) {
    return surface.description !== null ||
      surface.lettering !== null ||
      surface.thumbnailUrl !== null ||
      surface.imageUrl !== null ||
      surface.engraverIds.length > 0
      ? surface
      : null
  }

  function mapEdgeSurface(surface: z.output<typeof edgeSurfaceSchema>) {
    return surface.description !== null ||
      surface.lettering !== null ||
      surface.thumbnailUrl !== null ||
      surface.imageUrl !== null
      ? surface
      : null
  }

  return {
    ...rest,
    isDemonetized: mapDemonetizationStatus(demonetizationStatus),
    mintIds: mapAttributionIds(mints, "mintId"),
    rulerIds: mapAttributionIds(rulers, "rulerId"),
    themeIds: mapAttributionIds(themes, "themeId"),
    surfaces: {
      obverse: mapFaceSurface(rest.surfaces.obverse),
      reverse: mapFaceSurface(rest.surfaces.reverse),
      edge: mapEdgeSurface(rest.surfaces.edge),
    },
  }
}

function createPersistenceError(): CoinMutationResult {
  return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
}

function createDeletePersistenceError(): CoinDeleteMutationResult {
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

  const validationResult = validateInput(coinDraftSchema, input)

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
  } catch {
    return createPersistenceError()
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

  const validationResult = validateInput(updateCoinInputSchema, input)

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
  } catch {
    return createPersistenceError()
  }
}

export async function submitDeleteCoin(
  collector: CollectorWithRole | null,
  input: DeleteCoinInput,
  dependencies?: CoinDeleteDependencies
): Promise<CoinDeleteMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateInput(deleteCoinInputSchema, input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultDeleteDependencies())

  try {
    const deleteSummary =
      await resolvedDependencies.getCoinMaintenanceDeleteSummary(
        validationResult.data.id
      )

    if (deleteSummary === null) {
      return createFormErrorResult(COIN_MISSING_ERROR)
    }

    if (validationResult.data.confirmationTitle !== deleteSummary.title) {
      return createFieldErrorResult({
        confirmationTitle: COIN_DELETE_CONFIRMATION_ERROR,
      })
    }

    const deletedCoin = await resolvedDependencies.deleteCoinMaintenance({
      id: validationResult.data.id,
    })

    if (deletedCoin === null) {
      return createFormErrorResult(COIN_MISSING_ERROR)
    }

    return {
      status: "success",
      message: "Coin deleted.",
      redirectTo: "/database/coins",
    }
  } catch {
    return createDeletePersistenceError()
  }
}
