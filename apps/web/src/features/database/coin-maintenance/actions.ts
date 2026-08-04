import { hasEditorAccess } from "@coin-archive/auth/client"
import { z } from "zod"
import type { MaintenanceApiClient } from "@coin-archive/api"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"

type SurfaceImageUploadRequest = {
  contentLength: number
  contentType: string
  surface: "obverse" | "reverse" | "edge"
}

type SurfaceImageUploadAuthorization = {
  reference: string
  uploadUrl: string
}

export const COIN_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Coins."
export const COIN_GENERIC_SAVE_ERROR = "Unable to save Coin right now."
export const COIN_MISSING_ERROR = "Coin no longer exists."
export const COIN_EDIT_CONFLICT_ERROR =
  "This Coin changed after you loaded it. Reload it and reconcile your edits before saving again."
export const COIN_DELETE_CONFIRMATION_ERROR =
  "Enter the current Coin Title exactly to confirm deletion."
const DUPLICATE_REFERENCE_ERROR =
  "Duplicate Catalogue References are not allowed on the same Coin."
const DUPLICATE_ENGRAVER_ERROR =
  "Duplicate Engraver Attributions are not allowed on the same face."
export const SURFACE_IMAGE_UPLOAD_ERROR =
  "Unable to upload Surface Image right now."
const SURFACE_IMAGE_URL_ERROR =
  "Surface Image URL must be an absolute http:// or https:// URL."

const COIN_FIELD_NAMES = [
  "title",
  "issuerId",
  "rulers",
  "distributionId",
  "compositionId",
  "compositionDescription",
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

const optionalAbsoluteWebUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return null
    }

    const normalizedValue = value.trim()
    return normalizedValue === "" ? null : normalizedValue
  },
  z
    .string()
    .url()
    .refine((value) => /^https?:\/\//i.test(value))
    .nullable()
)

const rulerAttributionSchema = z.object({
  rulerId: attributionRowUuidSchema,
})

const mintAttributionSchema = z.object({
  mintId: attributionRowUuidSchema,
})

const themeAttributionSchema = z.object({
  themeId: attributionRowUuidSchema,
})

const referenceSchema = z.object({
  catalogueId: z.uuid(),
  number: z.string().trim().min(1, "Reference Number cannot be blank."),
})

const faceSurfaceSchema = z.object({
  description: optionalTrimmedStringSchema,
  lettering: optionalTrimmedStringSchema,
  imageUrl: optionalAbsoluteWebUrlSchema,
  imageUploadReference: z.string().default(""),
  engraverIds: z.array(z.uuid()),
})

const edgeSurfaceSchema = z.object({
  description: optionalTrimmedStringSchema,
  lettering: optionalTrimmedStringSchema,
  imageUrl: optionalAbsoluteWebUrlSchema,
  imageUploadReference: z.string().default(""),
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
    compositionDescription: optionalTrimmedStringSchema,
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
  etag: z.string().min(1),
})
export const deleteCoinInputSchema = z.object({
  id: z.uuid(),
  etag: z.string().min(1),
  confirmationTitle: z.string(),
})

type CoinFieldName = (typeof COIN_FIELD_NAMES)[number]

export type CoinDraft = z.input<typeof coinDraftSchema>
export type CoinReferenceDraft = z.input<typeof referenceSchema>
export type CoinFaceSurfaceDraft = z.input<typeof faceSurfaceSchema>
export type CoinEdgeSurfaceDraft = z.input<typeof edgeSurfaceSchema>
type CoinDraftData = z.output<typeof coinDraftSchema>
type CoinFaceSurfaceData = z.output<typeof faceSurfaceSchema>
type CoinEdgeSurfaceData = z.output<typeof edgeSurfaceSchema>
type CoinFaceSurfacePersistenceData = Omit<
  CoinFaceSurfaceData,
  "imageUploadReference"
>
type CoinEdgeSurfacePersistenceData = Omit<
  CoinEdgeSurfaceData,
  "imageUploadReference"
>
type UpdateCoinInput = z.input<typeof updateCoinInputSchema>
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
    obverse: CoinFaceSurfacePersistenceData | null
    reverse: CoinFaceSurfacePersistenceData | null
    edge: CoinEdgeSurfacePersistenceData | null
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

type CoinReplaceDependencies = {
  replaceCoin: MaintenanceApiClient["coins"]["replace"]
}

type CoinCreateDependencies = {
  createCoin: MaintenanceApiClient["coins"]["create"]
  createIdempotencyKey: () => string
}

type SurfaceImageUploadDependencies = {
  authorizeUpload: MaintenanceApiClient["surfaceImageUploads"]["authorize"]
  createIdempotencyKey: () => string
}
type SurfaceImageUploadRemovalDependencies = {
  cancelUpload: MaintenanceApiClient["surfaceImageUploads"]["cancel"]
}

type CoinDeleteDependencies = {
  deleteCoin: MaintenanceApiClient["coins"]["delete"]
  getCoinMaintenanceDeleteSummary: MaintenanceApiClient["coins"]["deleteSummary"]
}

async function getDefaultCoinReplaceDependencies(): Promise<CoinReplaceDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  return { replaceCoin: (await getMaintenanceApiClient()).coins.replace }
}

async function getDefaultCoinCreateDependencies(): Promise<CoinCreateDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    createCoin: client.coins.create,
    createIdempotencyKey: () => crypto.randomUUID(),
  }
}

async function getDefaultSurfaceImageUploadDependencies(): Promise<
  SurfaceImageUploadDependencies & SurfaceImageUploadRemovalDependencies
> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()
  return {
    authorizeUpload: client.surfaceImageUploads.authorize,
    cancelUpload: client.surfaceImageUploads.cancel,
    createIdempotencyKey: () => crypto.randomUUID(),
  }
}

async function getDefaultDeleteDependencies(): Promise<CoinDeleteDependencies> {
  const { getMaintenanceApiClient } =
    await import("@/lib/maintenance-api.server")
  const client = await getMaintenanceApiClient()

  return {
    deleteCoin: client.coins.delete,
    getCoinMaintenanceDeleteSummary: client.coins.deleteSummary,
  }
}

function createAuthorizationError(): CoinMutationErrorResult {
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

function getIssueMessage(issue: z.ZodIssue) {
  if (
    issue.path.at(-1) === "imageUrl" &&
    issue.path.join(".").startsWith("surfaces.")
  ) {
    return SURFACE_IMAGE_URL_ERROR
  }

  return issue.message
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

function hasFaceSurfaceContent(surface: CoinFaceSurfacePersistenceData) {
  return (
    surface.description !== null ||
    surface.lettering !== null ||
    surface.imageUrl !== null ||
    surface.engraverIds.length > 0
  )
}

function hasEdgeSurfaceContent(surface: CoinEdgeSurfacePersistenceData) {
  return (
    surface.description !== null ||
    surface.lettering !== null ||
    surface.imageUrl !== null
  )
}

function mapOptionalFaceSurface(surface: CoinFaceSurfacePersistenceData) {
  return hasFaceSurfaceContent(surface) ? surface : null
}

function mapOptionalEdgeSurface(surface: CoinEdgeSurfacePersistenceData) {
  return hasEdgeSurfaceContent(surface) ? surface : null
}

function mapDraftToPersistenceInput(
  input: CoinDraftData
): CoinPersistenceInput {
  const { demonetizationStatus, mints, rulers, themes, ...rest } = input
  const toPersistenceSurface = <
    TSurface extends { imageUploadReference: string },
  >(
    surface: TSurface
  ) => {
    const {
      imageUploadReference: _imageUploadReference,
      ...persistenceSurface
    } = surface
    return persistenceSurface
  }

  return {
    ...rest,
    isDemonetized: mapDemonetizationStatus(demonetizationStatus),
    mintIds: mapAttributionIds(mints, "mintId"),
    rulerIds: mapAttributionIds(rulers, "rulerId"),
    themeIds: mapAttributionIds(themes, "themeId"),
    surfaces: {
      obverse: mapOptionalFaceSurface(
        toPersistenceSurface(rest.surfaces.obverse)
      ),
      reverse: mapOptionalFaceSurface(
        toPersistenceSurface(rest.surfaces.reverse)
      ),
      edge: mapOptionalEdgeSurface(toPersistenceSurface(rest.surfaces.edge)),
    },
  }
}

export async function authorizeSurfaceImageUpload(
  input: SurfaceImageUploadRequest,
  dependencies?: SurfaceImageUploadDependencies
): Promise<SurfaceImageUploadAuthorization | CoinMutationErrorResult> {
  try {
    const resolved =
      dependencies ?? (await getDefaultSurfaceImageUploadDependencies())
    const result = await resolved.authorizeUpload({
      headers: { "idempotency-key": resolved.createIdempotencyKey() },
      body: input as {
        surface: "obverse" | "reverse" | "edge"
        contentType: "image/jpeg" | "image/png" | "image/webp"
        contentLength: number
      },
    })
    return {
      reference: result.body.reference,
      uploadUrl: result.body.uploadUrl,
    }
  } catch (error) {
    return createFormErrorResult(getSurfaceImageApiError(error))
  }
}

export async function removeSurfaceImageUpload(
  input: { reference: string; surface: "obverse" | "reverse" | "edge" },
  dependencies?: SurfaceImageUploadRemovalDependencies
): Promise<void | CoinMutationErrorResult> {
  try {
    await (
      dependencies ?? (await getDefaultSurfaceImageUploadDependencies())
    ).cancelUpload({ body: input })
  } catch (error) {
    return createFormErrorResult(getSurfaceImageApiError(error))
  }
}

function getSurfaceImageApiError(error: unknown) {
  const problem = getApiProblem(error)
  if (problem === null) return SURFACE_IMAGE_UPLOAD_ERROR
  return problem.code === "authentication_required" ||
    problem.code === "editor_access_required"
    ? COIN_AUTHORIZATION_ERROR
    : problem.code === "surface_image_upload_validation_failed"
      ? "Surface Images must be JPEG, PNG, or WebP files up to 10 MB."
      : SURFACE_IMAGE_UPLOAD_ERROR
}

export async function submitCreateCoin(
  collector: CollectorWithRole | null,
  input: CoinDraft,
  dependencies?: CoinCreateDependencies
): Promise<CoinMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateInput(coinDraftSchema, input)

  if (!validationResult.success) {
    return validationResult.result
  }

  try {
    const resolved = dependencies ?? (await getDefaultCoinCreateDependencies())
    const created = await resolved.createCoin({
      headers: { "idempotency-key": resolved.createIdempotencyKey() },
      body: mapDraftToCreateBody(validationResult.data),
    })

    return {
      status: "success",
      coinId: created.body.data.id,
      message: "Coin created.",
    }
  } catch (error) {
    return getCoinCreateApiError(error)
  }
}

function mapDraftToCreateBody(input: CoinDraftData) {
  const fields = mapDraftToPersistenceInput(input)
  const surfaceFields = (value: CoinFaceSurfaceData | CoinEdgeSurfaceData) => {
    const imageUploadReference = value.imageUploadReference.trim() || null
    return {
      description: value.description,
      lettering: value.lettering,
      imageUploadReference,
    }
  }
  const face = (value: CoinFaceSurfaceData) => {
    const common = surfaceFields(value)
    return common.description === null &&
      common.lettering === null &&
      common.imageUploadReference === null &&
      value.engraverIds.length === 0
      ? null
      : { ...common, engraverIds: value.engraverIds }
  }
  const edge = (value: CoinEdgeSurfaceData) => {
    const common = surfaceFields(value)
    return common.description === null &&
      common.lettering === null &&
      common.imageUploadReference === null
      ? null
      : common
  }
  return {
    ...fields,
    diameter: fields.diameter === null ? null : String(fields.diameter),
    faceValueNumericValue: String(fields.faceValueNumericValue),
    mintage: fields.mintage === null ? null : String(fields.mintage),
    thickness: fields.thickness === null ? null : String(fields.thickness),
    weight: fields.weight === null ? null : String(fields.weight),
    surfaces: {
      obverse: face(input.surfaces.obverse),
      reverse: face(input.surfaces.reverse),
      edge: edge(input.surfaces.edge),
    },
  }
}

function getCoinCreateApiError(error: unknown): CoinMutationErrorResult {
  const problem = getApiProblem(error)
  if (problem === null) return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
  if (
    problem.code === "authentication_required" ||
    problem.code === "editor_access_required"
  ) {
    return createAuthorizationError()
  }
  if (problem.code === "coin_validation_failed" && problem.invalidParams) {
    return createFieldErrorResult(
      Object.fromEntries(
        problem.invalidParams.map(({ name, reason }) => [
          name.replace(/^\//, "").replaceAll("/", "."),
          reason,
        ])
      )
    )
  }
  return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
}

function getApiProblem(error: unknown): {
  code: string
  invalidParams?: Array<{ name: string; reason: string }>
} | null {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return null
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data))
    return null
  const body = data.body
  if (
    typeof body !== "object" ||
    body === null ||
    !("code" in body) ||
    typeof body.code !== "string"
  )
    return null
  const invalidParams =
    "invalidParams" in body && Array.isArray(body.invalidParams)
      ? body.invalidParams.filter(
          (item): item is { name: string; reason: string } =>
            typeof item === "object" &&
            item !== null &&
            "name" in item &&
            typeof item.name === "string" &&
            "reason" in item &&
            typeof item.reason === "string"
        )
      : undefined
  return { code: body.code, ...(invalidParams ? { invalidParams } : {}) }
}

export async function submitUpdateCoin(
  collector: CollectorWithRole | null,
  input: UpdateCoinInput,
  dependencies?: CoinReplaceDependencies
): Promise<CoinMutationResult> {
  if (!hasCoinMaintenanceAccess(collector)) {
    return createAuthorizationError()
  }

  const validationResult = validateInput(updateCoinInputSchema, input)

  if (!validationResult.success) {
    return validationResult.result
  }

  const { id, etag, ...draft } = validationResult.data

  try {
    const resolved = dependencies ?? (await getDefaultCoinReplaceDependencies())
    const replaced = await resolved.replaceCoin({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: mapDraftToReplaceBody(draft),
    })

    return {
      status: "success",
      coinId: replaced.body.data.id,
      message: "Saved.",
    }
  } catch (error) {
    return getCoinReplaceApiError(error)
  }
}

function mapDraftToReplaceBody(input: CoinDraftData) {
  const fields = mapDraftToCreateBody(input)
  const face = (surface: CoinFaceSurfaceData) => {
    const common = {
      description: surface.description,
      lettering: surface.lettering,
      imageUrl: surface.imageUrl,
      imageUploadReference: surface.imageUploadReference.trim() || null,
    }
    return common.description === null &&
      common.lettering === null &&
      common.imageUrl === null &&
      common.imageUploadReference === null &&
      surface.engraverIds.length === 0
      ? null
      : { ...common, engraverIds: surface.engraverIds }
  }
  const edge = (surface: CoinEdgeSurfaceData) => {
    const value = {
      description: surface.description,
      lettering: surface.lettering,
      imageUrl: surface.imageUrl,
      imageUploadReference: surface.imageUploadReference.trim() || null,
    }
    return Object.values(value).every((field) => field === null) ? null : value
  }
  return {
    ...fields,
    surfaces: {
      obverse: face(input.surfaces.obverse),
      reverse: face(input.surfaces.reverse),
      edge: edge(input.surfaces.edge),
    },
  }
}

function getCoinReplaceApiError(error: unknown): CoinMutationErrorResult {
  const problem = getApiProblem(error)
  if (problem?.code === "coin_precondition_failed") {
    return createFormErrorResult(COIN_EDIT_CONFLICT_ERROR)
  }
  if (problem?.code === "coin_not_found") {
    return createFormErrorResult(COIN_MISSING_ERROR)
  }
  return getCoinCreateApiError(error)
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
    const deleteSummary = (
      await resolvedDependencies.getCoinMaintenanceDeleteSummary({
        uuid: validationResult.data.id,
      })
    ).data

    if (validationResult.data.confirmationTitle !== deleteSummary.title) {
      return createFieldErrorResult({
        confirmationTitle: COIN_DELETE_CONFIRMATION_ERROR,
      })
    }

    await resolvedDependencies.deleteCoin({
      params: { uuid: validationResult.data.id },
      headers: { "if-match": validationResult.data.etag },
    })

    return {
      status: "success",
      message: "Coin deleted.",
      redirectTo: "/database/coins",
    }
  } catch (error) {
    return getCoinReplaceApiError(error)
  }
}
