import { hasEditorAccess } from "@coin-archive/auth/client"
import { z } from "zod"
import type { MaintenanceApiClient } from "@coin-archive/api"

import { getCollectorRole } from "@/lib/collector-role"
import type { CollectorWithRole } from "@/lib/collector-role"
import type { CoinMaintenanceDeleteSummary } from "@coin-archive/db"
import type {
  SurfaceImageUploadAuthorization,
  SurfaceImageUploadRequest,
} from "./surface-images/surface-image-storage"

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
    obverse: CoinFaceSurfacePersistenceData | null
    reverse: CoinFaceSurfacePersistenceData | null
    edge: CoinEdgeSurfacePersistenceData | null
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

type CoinMutationDependencies = {
  createCoinMaintenance: (
    input: CoinPersistenceInput
  ) => Promise<{ id: string }>
  updateCoinMaintenance: (
    input: UpdateCoinPersistenceInput
  ) => Promise<{ id: string } | null>
  resolveSurfaceImageUpload: (
    reference: string,
    surface: "obverse" | "reverse" | "edge"
  ) => Promise<{ imageUrl: string }>
  getPersistedSurfaceImageUrls: (
    coinId: string
  ) => Promise<SurfaceImageUrls | null>
  deleteSurfaceImage: (imageUrl: string) => Promise<void>
}

type SurfaceImageUrls = Record<"obverse" | "reverse" | "edge", string | null>

type SurfaceImageUploadDependencies = {
  authorizeUpload: MaintenanceApiClient["surfaceImageUploads"]["authorize"]
  createIdempotencyKey: () => string
}
type SurfaceImageUploadRemovalDependencies = {
  cancelUpload: MaintenanceApiClient["surfaceImageUploads"]["cancel"]
}

type CoinDeleteDependencies = {
  deleteCoinMaintenance: (input: {
    id: string
  }) => Promise<{ id: string } | null>
  deleteSurfaceImage: (imageUrl: string) => Promise<void>
  getCoinMaintenanceDeleteSummary: (
    coinId: string
  ) => Promise<CoinMaintenanceDeleteSummary | null>
  getCoinSurfaceImageUrls: (coinId: string) => Promise<string[] | null>
  recordSurfaceImageCleanupFailures: (input: {
    deletedCoinId: string
    failures: Array<{ errorMessage: string; imageUrl: string }>
  }) => Promise<void>
}

async function getDefaultDependencies(): Promise<CoinMutationDependencies> {
  const {
    createCoinMaintenance,
    getCoinMaintenanceRecord,
    updateCoinMaintenance,
  } = await import("@coin-archive/db")
  const { createR2SurfaceImageStorage } =
    await import("./surface-images/surface-image-storage")

  return {
    createCoinMaintenance,
    updateCoinMaintenance,
    resolveSurfaceImageUpload: async (reference, surface) =>
      createR2SurfaceImageStorage().resolveUpload(reference, surface),
    async getPersistedSurfaceImageUrls(coinId) {
      const coin = await getCoinMaintenanceRecord(coinId)
      if (coin === null) return null

      return {
        obverse: coin.surfaces.obverse?.imageUrl ?? null,
        reverse: coin.surfaces.reverse?.imageUrl ?? null,
        edge: coin.surfaces.edge?.imageUrl ?? null,
      }
    },
    deleteSurfaceImage: async (imageUrl) =>
      createR2SurfaceImageStorage().deletePublishedImage(imageUrl),
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
  const {
    deleteCoinMaintenance,
    getCoinMaintenanceDeleteSummary,
    getCoinMaintenanceRecord,
    recordSurfaceImageCleanupFailures,
  } = await import("@coin-archive/db")
  const { createR2SurfaceImageStorage } =
    await import("./surface-images/surface-image-storage")

  return {
    deleteCoinMaintenance,
    getCoinMaintenanceDeleteSummary,
    async getCoinSurfaceImageUrls(coinId) {
      const coin = await getCoinMaintenanceRecord(coinId)

      if (coin === null) {
        return null
      }

      return (["obverse", "reverse", "edge"] as const).flatMap((surface) => {
        const imageUrl = coin.surfaces[surface]?.imageUrl
        return imageUrl === null || imageUrl === undefined ? [] : [imageUrl]
      })
    },
    deleteSurfaceImage: async (imageUrl) =>
      createR2SurfaceImageStorage().deletePublishedImage(imageUrl),
    recordSurfaceImageCleanupFailures,
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

async function resolveSurfaceImageReferences(
  input: CoinDraftData,
  resolveSurfaceImageUpload: CoinMutationDependencies["resolveSurfaceImageUpload"],
  persistedSurfaceImageUrls?: SurfaceImageUrls,
  onPublishedImage?: (imageUrl: string) => void
) {
  const resolutions = await Promise.allSettled(
    (["obverse", "reverse", "edge"] as const).map(async (surface) => {
      const reference = input.surfaces[surface].imageUploadReference
      if (reference === "") {
        const imageUrl = input.surfaces[surface].imageUrl

        return [
          surface,
          {
            ...input.surfaces[surface],
            imageUrl:
              persistedSurfaceImageUrls?.[surface] === imageUrl
                ? imageUrl
                : null,
          },
        ] as const
      }

      const { imageUrl } = await resolveSurfaceImageUpload(reference, surface)
      onPublishedImage?.(imageUrl)
      return [surface, { ...input.surfaces[surface], imageUrl }] as const
    })
  )
  const failedResolution = resolutions.find(
    (resolution): resolution is PromiseRejectedResult =>
      resolution.status === "rejected"
  )
  if (failedResolution !== undefined) throw failedResolution.reason
  const surfaces = resolutions.map((resolution) => {
    if (resolution.status === "rejected") throw resolution.reason
    return resolution.value
  })

  return {
    ...input,
    surfaces: Object.fromEntries(surfaces) as CoinDraftData["surfaces"],
  }
}

async function deleteAbandonedPublishedImages(
  imageUrls: string[],
  deleteSurfaceImage: CoinMutationDependencies["deleteSurfaceImage"]
) {
  await Promise.allSettled(
    imageUrls.map((imageUrl) => deleteSurfaceImage(imageUrl))
  )
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
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return SURFACE_IMAGE_UPLOAD_ERROR
  }
  const data = error.data
  if (typeof data !== "object" || data === null || !("body" in data)) {
    return SURFACE_IMAGE_UPLOAD_ERROR
  }
  const body = data.body
  if (typeof body !== "object" || body === null || !("code" in body)) {
    return SURFACE_IMAGE_UPLOAD_ERROR
  }
  return body.code === "authentication_required" ||
    body.code === "editor_access_required"
    ? COIN_AUTHORIZATION_ERROR
    : body.code === "surface_image_upload_validation_failed"
      ? "Surface Images must be JPEG, PNG, or WebP files up to 10 MB."
      : SURFACE_IMAGE_UPLOAD_ERROR
}

function createPersistenceError(): CoinMutationResult {
  return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
}

function createDeletePersistenceError(): CoinDeleteMutationResult {
  return createFormErrorResult(COIN_GENERIC_SAVE_ERROR)
}

function getSurfaceImageCleanupFailureMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown storage cleanup error."

  return message.slice(0, 2000)
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

  const publishedImageUrls: string[] = []
  let resolvedDependencies: CoinMutationDependencies | undefined

  try {
    resolvedDependencies = dependencies ?? (await getDefaultDependencies())
    const inputWithResolvedImages = await resolveSurfaceImageReferences(
      validationResult.data,
      resolvedDependencies.resolveSurfaceImageUpload,
      undefined,
      (imageUrl) => publishedImageUrls.push(imageUrl)
    )
    const createdCoin = await resolvedDependencies.createCoinMaintenance(
      mapDraftToPersistenceInput(inputWithResolvedImages)
    )

    return {
      status: "success",
      coinId: createdCoin.id,
      message: "Coin created.",
    }
  } catch {
    if (resolvedDependencies !== undefined) {
      await deleteAbandonedPublishedImages(
        publishedImageUrls,
        resolvedDependencies.deleteSurfaceImage
      )
    }
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
  const publishedImageUrls: string[] = []
  let resolvedDependencies: CoinMutationDependencies | undefined
  let persisted = false

  try {
    resolvedDependencies = dependencies ?? (await getDefaultDependencies())
    const persistedSurfaceImageUrls =
      await resolvedDependencies.getPersistedSurfaceImageUrls(id)

    if (persistedSurfaceImageUrls === null) {
      return createFormErrorResult(COIN_MISSING_ERROR)
    }

    const draftWithResolvedImages = await resolveSurfaceImageReferences(
      draft,
      resolvedDependencies.resolveSurfaceImageUpload,
      persistedSurfaceImageUrls,
      (imageUrl) => publishedImageUrls.push(imageUrl)
    )
    const persistenceInput = mapDraftToPersistenceInput(draftWithResolvedImages)
    const updatedCoin = await resolvedDependencies.updateCoinMaintenance({
      id,
      ...persistenceInput,
    })

    if (updatedCoin === null) {
      await deleteAbandonedPublishedImages(
        publishedImageUrls,
        resolvedDependencies.deleteSurfaceImage
      )
      return createFormErrorResult(COIN_MISSING_ERROR)
    }
    persisted = true
    const deleteSurfaceImage = resolvedDependencies.deleteSurfaceImage

    await Promise.all(
      (["obverse", "reverse", "edge"] as const).flatMap((surface) => {
        const previousImageUrl = persistedSurfaceImageUrls[surface]
        const nextImageUrl =
          persistenceInput.surfaces[surface]?.imageUrl ?? null

        return previousImageUrl !== null && previousImageUrl !== nextImageUrl
          ? [deleteSurfaceImage(previousImageUrl)]
          : []
      })
    )

    return {
      status: "success",
      coinId: updatedCoin.id,
      message: "Saved.",
    }
  } catch {
    if (!persisted && resolvedDependencies !== undefined) {
      await deleteAbandonedPublishedImages(
        publishedImageUrls,
        resolvedDependencies.deleteSurfaceImage
      )
    }
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

    const surfaceImageUrls = await resolvedDependencies.getCoinSurfaceImageUrls(
      validationResult.data.id
    )

    if (surfaceImageUrls === null) {
      return createFormErrorResult(COIN_MISSING_ERROR)
    }

    const deletedCoin = await resolvedDependencies.deleteCoinMaintenance({
      id: validationResult.data.id,
    })

    if (deletedCoin === null) {
      return createFormErrorResult(COIN_MISSING_ERROR)
    }

    const cleanupResults = await Promise.all(
      surfaceImageUrls.map(async (imageUrl) => {
        try {
          await resolvedDependencies.deleteSurfaceImage(imageUrl)
          return { imageUrl, error: null }
        } catch (error) {
          return { imageUrl, error }
        }
      })
    )
    const failedCleanupResults = cleanupResults.filter(
      (result): result is { imageUrl: string; error: unknown } =>
        result.error !== null
    )

    if (failedCleanupResults.length > 0) {
      try {
        await resolvedDependencies.recordSurfaceImageCleanupFailures({
          deletedCoinId: deletedCoin.id,
          failures: failedCleanupResults.map((result) => ({
            imageUrl: result.imageUrl,
            errorMessage: getSurfaceImageCleanupFailureMessage(result.error),
          })),
        })
      } catch (error) {
        console.error(
          "Failed to retain Surface Image cleanup failures after Coin deletion.",
          { error, failedCleanupResults }
        )
      }
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
