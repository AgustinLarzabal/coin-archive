import { oc } from "@orpc/contract"
import { z } from "zod"

const codeSchema = z.string().min(1)
const namedCodeSchema = z.object({ code: codeSchema, name: z.string() })
const decimalSchema = z.string().regex(/^-?\d+(?:\.\d+)?$/)
const utcTimestampSchema = z.iso.datetime()

export const problemDocumentSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  invalidParams: z
    .array(z.object({ name: z.string(), reason: z.string() }))
    .optional(),
})

export const maintenanceProblemDocumentSchema = problemDocumentSchema.extend({
  code: z.string().min(1),
  invalidParams: z
    .array(
      z.object({
        name: z.string().startsWith("/"),
        code: z.string().min(1),
        reason: z.string(),
      })
    )
    .optional(),
})

export const databaseMaintenanceOverviewSchema = z.object({
  coins: z.number().int().nonnegative(),
  catalogues: z.number().int().nonnegative(),
  compositions: z.number().int().nonnegative(),
  currencies: z.number().int().nonnegative(),
  distributions: z.number().int().nonnegative(),
  edges: z.number().int().nonnegative(),
  rims: z.number().int().nonnegative(),
  shapes: z.number().int().nonnegative(),
  mintingTechniques: z.number().int().nonnegative(),
  engravers: z.number().int().nonnegative(),
  themes: z.number().int().nonnegative(),
  issuers: z.number().int().nonnegative(),
  rulers: z.number().int().nonnegative(),
  rulerGroups: z.number().int().nonnegative(),
  orientations: z.number().int().nonnegative(),
  mints: z.number().int().nonnegative(),
})

export const databaseMaintenanceOverviewOutputSchema = z.object({
  data: databaseMaintenanceOverviewSchema,
})

export const coinSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  issuer: z.object({ code: z.string(), isoCode: z.string(), name: z.string() }),
  surfaceImages: z.object({
    obverse: z.string().url().nullable(),
    reverse: z.string().url().nullable(),
    edge: z.string().url().nullable(),
  }),
  detailUrl: z.string().url(),
})

export const browseCoinsInputSchema = z.object({
  q: z.string().min(1).optional(),
  issuer: codeSchema.optional(),
  ruler: codeSchema.optional(),
  theme: codeSchema.optional(),
  engraver: codeSchema.optional(),
  distribution: codeSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export const browseCoinsOutputSchema = z.object({
  data: z.array(coinSummarySchema),
  nextCursor: z.string().nullable(),
})

const edgeSurfaceSchema = z.object({
  description: z.string().nullable(),
  lettering: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
})

const faceSurfaceSchema = edgeSurfaceSchema.extend({
  engravers: z.array(namedCodeSchema),
})

export const coinDetailSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  comments: z.string().nullable(),
  composition: namedCodeSchema,
  compositionDescription: z.string().regex(/\S/).nullable(),
  diameter: decimalSchema.nullable(),
  distribution: namedCodeSchema,
  edge: namedCodeSchema.nullable(),
  faceValue: z.object({
    text: z.string(),
    numericValue: decimalSchema,
    currency: z.object({
      code: codeSchema,
      name: z.string(),
      fullName: z.string(),
    }),
  }),
  isDemonetized: z.boolean().nullable(),
  issuer: z.object({ code: codeSchema, isoCode: z.string(), name: z.string() }),
  minYear: z.number().int().nullable(),
  maxYear: z.number().int().nullable(),
  mintage: decimalSchema.nullable(),
  mints: z.array(namedCodeSchema),
  orientation: namedCodeSchema.nullable(),
  references: z.array(
    z.object({
      catalogue: z.object({ code: codeSchema, title: z.string() }),
      number: z.string(),
    })
  ),
  rim: namedCodeSchema.nullable(),
  rulers: z.array(namedCodeSchema),
  shape: namedCodeSchema.nullable(),
  surfaces: z.object({
    obverse: faceSurfaceSchema.nullable(),
    reverse: faceSurfaceSchema.nullable(),
    edge: edgeSurfaceSchema.nullable(),
  }),
  technique: namedCodeSchema.nullable(),
  themes: z.array(namedCodeSchema),
  thickness: decimalSchema.nullable(),
  weight: decimalSchema.nullable(),
})

export const coinDetailOutputSchema = z.object({ data: coinDetailSchema })

export const orientationSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})

export const orientationOptionSchema = orientationSchema.pick({
  id: true,
  code: true,
  name: true,
})

export const orientationListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})

export const orientationListOutputSchema = z.object({
  data: z.array(orientationSchema),
  nextCursor: z.string().nullable(),
})

export const orientationOptionsInputSchema = orientationListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})

export const orientationOptionsOutputSchema = z.object({
  data: z.array(orientationOptionSchema),
  nextCursor: z.string().nullable(),
})

export const orientationDetailOutputSchema = z.object({
  data: orientationSchema,
})

export const orientationMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})

const idempotencyKeySchema = z.string().trim().min(1).max(255)
const ifMatchSchema = z
  .string()
  .trim()
  .regex(/^"[A-Za-z0-9_-]+"$/)

export const coinSurfaceSchema = z.enum(["obverse", "reverse", "edge"])
export const surfaceImageContentTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
])
export const surfaceImageUploadAuthorizationInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: z.object({
    surface: coinSurfaceSchema,
    contentType: surfaceImageContentTypeSchema,
    contentLength: z
      .number()
      .int()
      .min(1)
      .max(10 * 1024 * 1024),
  }),
})
export const surfaceImageUploadAuthorizationOutputSchema = z.object({
  status: z.literal(201),
  body: z.object({
    reference: z.string().min(1),
    uploadUrl: z.string().url(),
    expiresAt: utcTimestampSchema,
  }),
})
export const surfaceImageUploadCancellationInputSchema = z.object({
  body: z.object({
    surface: coinSurfaceSchema,
    reference: z.string().min(1),
  }),
})
export const surfaceImageUploadCancellationOutputSchema = z.object({
  status: z.literal(204),
})

export const orientationCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: orientationMutationBodySchema,
})

export const orientationCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/orientations/"),
    etag: z.string(),
  }),
  body: orientationDetailOutputSchema,
})

export const orientationReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: orientationMutationBodySchema,
})

export const orientationReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: orientationDetailOutputSchema,
})

export const orientationDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})

export const catalogueSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  title: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})

export const catalogueOptionSchema = catalogueSchema.pick({
  id: true,
  code: true,
  title: true,
})
export const catalogueListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["title", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const catalogueListOutputSchema = z.object({
  data: z.array(catalogueSchema),
  nextCursor: z.string().nullable(),
})
export const catalogueOptionsInputSchema = catalogueListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const catalogueOptionsOutputSchema = z.object({
  data: z.array(catalogueOptionSchema),
  nextCursor: z.string().nullable(),
})
export const catalogueDetailOutputSchema = z.object({ data: catalogueSchema })
export const catalogueMutationBodySchema = z.object({
  code: z.string().trim().min(1).max(255),
  title: z.string().trim().min(1).max(255),
})
export const catalogueCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: catalogueMutationBodySchema,
})
export const catalogueCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/catalogues/"),
    etag: z.string(),
  }),
  body: catalogueDetailOutputSchema,
})
export const catalogueReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: catalogueMutationBodySchema,
})
export const catalogueReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: catalogueDetailOutputSchema,
})
export const catalogueDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const catalogueDeleteOutputSchema = z.object({ status: z.literal(204) })

export const compositionSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})

export const compositionOptionSchema = compositionSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const compositionListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const compositionListOutputSchema = z.object({
  data: z.array(compositionSchema),
  nextCursor: z.string().nullable(),
})
export const compositionOptionsInputSchema = compositionListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const compositionOptionsOutputSchema = z.object({
  data: z.array(compositionOptionSchema),
  nextCursor: z.string().nullable(),
})
export const compositionDetailOutputSchema = z.object({
  data: compositionSchema,
})
export const compositionMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const compositionCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: compositionMutationBodySchema,
})
export const compositionCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/compositions/"),
    etag: z.string(),
  }),
  body: compositionDetailOutputSchema,
})
export const compositionReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: compositionMutationBodySchema,
})
export const compositionReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: compositionDetailOutputSchema,
})
export const compositionDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const compositionDeleteOutputSchema = z.object({
  status: z.literal(204),
})

export const distributionSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})

export const distributionOptionSchema = distributionSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const distributionListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const distributionListOutputSchema = z.object({
  data: z.array(distributionSchema),
  nextCursor: z.string().nullable(),
})
export const distributionOptionsInputSchema = distributionListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const distributionOptionsOutputSchema = z.object({
  data: z.array(distributionOptionSchema),
  nextCursor: z.string().nullable(),
})
export const distributionDetailOutputSchema = z.object({
  data: distributionSchema,
})
export const distributionMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const distributionCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: distributionMutationBodySchema,
})
export const distributionCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/distributions/"),
    etag: z.string(),
  }),
  body: distributionDetailOutputSchema,
})
export const distributionReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: distributionMutationBodySchema,
})
export const distributionReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: distributionDetailOutputSchema,
})
export const distributionDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const distributionDeleteOutputSchema = z.object({
  status: z.literal(204),
})

export const edgeSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const edgeOptionSchema = edgeSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const edgeListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const edgeListOutputSchema = z.object({
  data: z.array(edgeSchema),
  nextCursor: z.string().nullable(),
})
export const edgeOptionsInputSchema = edgeListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const edgeOptionsOutputSchema = z.object({
  data: z.array(edgeOptionSchema),
  nextCursor: z.string().nullable(),
})
export const edgeDetailInputSchema = z.object({ uuid: z.uuid() })
export const edgeDetailOutputSchema = z.object({ data: edgeSchema })
export const edgeMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const edgeCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: edgeMutationBodySchema,
})
export const edgeCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/edges/"),
    etag: z.string(),
  }),
  body: edgeDetailOutputSchema,
})
export const edgeReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: edgeMutationBodySchema,
})
export const edgeReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: edgeDetailOutputSchema,
})
export const edgeDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const edgeDeleteOutputSchema = z.object({ status: z.literal(204) })
export const edgeMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "edge_code_conflict",
      "edge_in_use",
      "edge_not_found",
      "edge_precondition_failed",
      "edge_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_edge_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "edge_body_invalid",
            "edge_code_invalid",
            "edge_code_required",
            "edge_code_too_long",
            "edge_name_invalid",
            "edge_name_required",
            "edge_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const rimSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const rimOptionSchema = rimSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const rimListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const rimListOutputSchema = z.object({
  data: z.array(rimSchema),
  nextCursor: z.string().nullable(),
})
export const rimOptionsInputSchema = rimListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const rimOptionsOutputSchema = z.object({
  data: z.array(rimOptionSchema),
  nextCursor: z.string().nullable(),
})
export const rimDetailInputSchema = z.object({ uuid: z.uuid() })
export const rimDetailOutputSchema = z.object({ data: rimSchema })
export const rimMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const rimCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: rimMutationBodySchema,
})
export const rimCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/rims/"),
    etag: z.string(),
  }),
  body: rimDetailOutputSchema,
})
export const rimReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: rimMutationBodySchema,
})
export const rimReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: rimDetailOutputSchema,
})
export const rimDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const rimDeleteOutputSchema = z.object({ status: z.literal(204) })
export const rimMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "rim_code_conflict",
      "rim_in_use",
      "rim_not_found",
      "rim_precondition_failed",
      "rim_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_rim_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "rim_body_invalid",
            "rim_code_invalid",
            "rim_code_required",
            "rim_code_too_long",
            "rim_name_invalid",
            "rim_name_required",
            "rim_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const shapeSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const shapeOptionSchema = shapeSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const shapeListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const shapeListOutputSchema = z.object({
  data: z.array(shapeSchema),
  nextCursor: z.string().nullable(),
})
export const shapeOptionsInputSchema = shapeListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const shapeOptionsOutputSchema = z.object({
  data: z.array(shapeOptionSchema),
  nextCursor: z.string().nullable(),
})
export const shapeDetailInputSchema = z.object({ uuid: z.uuid() })
export const shapeDetailOutputSchema = z.object({ data: shapeSchema })
export const shapeMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const shapeCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: shapeMutationBodySchema,
})
export const shapeCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/shapes/"),
    etag: z.string(),
  }),
  body: shapeDetailOutputSchema,
})
export const shapeReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: shapeMutationBodySchema,
})
export const shapeReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: shapeDetailOutputSchema,
})
export const shapeDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const shapeDeleteOutputSchema = z.object({ status: z.literal(204) })
export const shapeMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "shape_code_conflict",
      "shape_in_use",
      "shape_not_found",
      "shape_precondition_failed",
      "shape_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_shape_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "shape_body_invalid",
            "shape_code_invalid",
            "shape_code_required",
            "shape_code_too_long",
            "shape_name_invalid",
            "shape_name_required",
            "shape_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const engraverSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const engraverOptionSchema = engraverSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const engraverListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const engraverListOutputSchema = z.object({
  data: z.array(engraverSchema),
  nextCursor: z.string().nullable(),
})
export const engraverOptionsInputSchema = engraverListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const engraverOptionsOutputSchema = z.object({
  data: z.array(engraverOptionSchema),
  nextCursor: z.string().nullable(),
})
export const engraverDetailInputSchema = z.object({ uuid: z.uuid() })
export const engraverDetailOutputSchema = z.object({ data: engraverSchema })
export const engraverMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const engraverCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: engraverMutationBodySchema,
})
export const engraverCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/engravers/"),
    etag: z.string(),
  }),
  body: engraverDetailOutputSchema,
})
export const engraverReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: engraverMutationBodySchema,
})
export const engraverReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: engraverDetailOutputSchema,
})
export const engraverDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const engraverDeleteOutputSchema = z.object({ status: z.literal(204) })
export const engraverMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "engraver_code_conflict",
      "engraver_in_use",
      "engraver_not_found",
      "engraver_precondition_failed",
      "engraver_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_engraver_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "engraver_body_invalid",
            "engraver_code_invalid",
            "engraver_code_required",
            "engraver_code_too_long",
            "engraver_name_invalid",
            "engraver_name_required",
            "engraver_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const themeSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const themeOptionSchema = themeSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const themeListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const themeListOutputSchema = z.object({
  data: z.array(themeSchema),
  nextCursor: z.string().nullable(),
})
export const themeOptionsInputSchema = themeListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const themeOptionsOutputSchema = z.object({
  data: z.array(themeOptionSchema),
  nextCursor: z.string().nullable(),
})
export const themeDetailInputSchema = z.object({ uuid: z.uuid() })
export const themeDetailOutputSchema = z.object({ data: themeSchema })
export const themeMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const themeCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: themeMutationBodySchema,
})
export const themeCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/themes/"),
    etag: z.string(),
  }),
  body: themeDetailOutputSchema,
})
export const themeReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: themeMutationBodySchema,
})
export const themeReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: themeDetailOutputSchema,
})
export const themeDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const themeDeleteOutputSchema = z.object({ status: z.literal(204) })
export const themeMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "theme_code_conflict",
      "theme_in_use",
      "theme_not_found",
      "theme_precondition_failed",
      "theme_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_theme_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "theme_body_invalid",
            "theme_code_invalid",
            "theme_code_required",
            "theme_code_too_long",
            "theme_name_invalid",
            "theme_name_required",
            "theme_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const issuerSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  isoCode: z.string().regex(/^[A-Z]{2}$/),
  name: z.string(),
  parentIssuerId: z.uuid().nullable(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const issuerOptionSchema = issuerSchema.pick({
  id: true,
  code: true,
  isoCode: true,
  name: true,
})
export const issuerListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code", "isoCode"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const issuerListOutputSchema = z.object({
  data: z.array(issuerSchema),
  nextCursor: z.string().nullable(),
})
export const issuerOptionsInputSchema = issuerListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const issuerOptionsOutputSchema = z.object({
  data: z.array(issuerOptionSchema),
  nextCursor: z.string().nullable(),
})
export const issuerDetailInputSchema = z.object({ uuid: z.uuid() })
export const issuerDetailOutputSchema = z.object({ data: issuerSchema })
export const issuerMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isoCode: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{2}$/)),
  name: z.string().trim().min(1).max(255),
  parentIssuerId: z.uuid().nullable(),
})
export const issuerCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: issuerMutationBodySchema,
})
export const issuerCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/issuers/"),
    etag: z.string(),
  }),
  body: issuerDetailOutputSchema,
})
export const issuerReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: issuerMutationBodySchema,
})
export const issuerReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: issuerDetailOutputSchema,
})
export const issuerDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const issuerDeleteOutputSchema = z.object({ status: z.literal(204) })
export const issuerMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "issuer_code_conflict",
      "issuer_has_children",
      "issuer_in_use",
      "issuer_not_found",
      "issuer_parent_cycle",
      "issuer_parent_not_found",
      "issuer_precondition_failed",
      "issuer_self_parent",
      "issuer_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_issuer_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/isoCode", "/name", "/parentIssuerId"]),
          code: z.enum([
            "issuer_body_invalid",
            "issuer_code_invalid",
            "issuer_code_required",
            "issuer_code_too_long",
            "issuer_iso_code_invalid",
            "issuer_iso_code_required",
            "issuer_name_invalid",
            "issuer_name_required",
            "issuer_name_too_long",
            "issuer_parent_cycle",
            "issuer_parent_invalid",
            "issuer_parent_not_found",
            "issuer_self_parent",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const mintSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const mintOptionSchema = mintSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const mintListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const mintListOutputSchema = z.object({
  data: z.array(mintSchema),
  nextCursor: z.string().nullable(),
})
export const mintOptionsInputSchema = mintListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const mintOptionsOutputSchema = z.object({
  data: z.array(mintOptionSchema),
  nextCursor: z.string().nullable(),
})
export const mintDetailInputSchema = z.object({ uuid: z.uuid() })
export const mintDetailOutputSchema = z.object({
  data: mintSchema,
})
export const mintMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const mintCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: mintMutationBodySchema,
})
export const mintCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/mints/"),
    etag: z.string(),
  }),
  body: mintDetailOutputSchema,
})
export const mintReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: mintMutationBodySchema,
})
export const mintReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: mintDetailOutputSchema,
})
export const mintDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const mintDeleteOutputSchema = z.object({
  status: z.literal(204),
})
export const mintMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "mint_code_conflict",
      "mint_in_use",
      "mint_not_found",
      "mint_precondition_failed",
      "mint_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_mint_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "mint_body_invalid",
            "mint_code_invalid",
            "mint_code_required",
            "mint_code_too_long",
            "mint_name_invalid",
            "mint_name_required",
            "mint_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const mintingTechniqueSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const mintingTechniqueOptionSchema = mintingTechniqueSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const mintingTechniqueListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const mintingTechniqueListOutputSchema = z.object({
  data: z.array(mintingTechniqueSchema),
  nextCursor: z.string().nullable(),
})
export const mintingTechniqueOptionsInputSchema =
  mintingTechniqueListInputSchema.pick({
    q: true,
    cursor: true,
    limit: true,
  })
export const mintingTechniqueOptionsOutputSchema = z.object({
  data: z.array(mintingTechniqueOptionSchema),
  nextCursor: z.string().nullable(),
})
export const mintingTechniqueDetailInputSchema = z.object({ uuid: z.uuid() })
export const mintingTechniqueDetailOutputSchema = z.object({
  data: mintingTechniqueSchema,
})
export const mintingTechniqueMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const mintingTechniqueCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: mintingTechniqueMutationBodySchema,
})
export const mintingTechniqueCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/minting-techniques/"),
    etag: z.string(),
  }),
  body: mintingTechniqueDetailOutputSchema,
})
export const mintingTechniqueReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: mintingTechniqueMutationBodySchema,
})
export const mintingTechniqueReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: mintingTechniqueDetailOutputSchema,
})
export const mintingTechniqueDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const mintingTechniqueDeleteOutputSchema = z.object({
  status: z.literal(204),
})
export const mintingTechniqueMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "minting_technique_code_conflict",
      "minting_technique_in_use",
      "minting_technique_not_found",
      "minting_technique_precondition_failed",
      "minting_technique_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_minting_technique_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "minting_technique_body_invalid",
            "minting_technique_code_invalid",
            "minting_technique_code_required",
            "minting_technique_code_too_long",
            "minting_technique_name_invalid",
            "minting_technique_name_required",
            "minting_technique_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const rulerGroupSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const rulerGroupOptionSchema = rulerGroupSchema.pick({
  id: true,
  code: true,
  name: true,
})
export const rulerGroupListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const rulerGroupListOutputSchema = z.object({
  data: z.array(rulerGroupSchema),
  nextCursor: z.string().nullable(),
})
export const rulerGroupOptionsInputSchema = rulerGroupListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const rulerGroupOptionsOutputSchema = z.object({
  data: z.array(rulerGroupOptionSchema),
  nextCursor: z.string().nullable(),
})
export const rulerGroupDetailInputSchema = z.object({ uuid: z.uuid() })
export const rulerGroupDetailOutputSchema = z.object({
  data: rulerGroupSchema,
})
export const rulerGroupMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
})
export const rulerGroupCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: rulerGroupMutationBodySchema,
})
export const rulerGroupCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/ruler-groups/"),
    etag: z.string(),
  }),
  body: rulerGroupDetailOutputSchema,
})
export const rulerGroupReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: rulerGroupMutationBodySchema,
})
export const rulerGroupReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: rulerGroupDetailOutputSchema,
})
export const rulerGroupDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const rulerGroupDeleteOutputSchema = z.object({
  status: z.literal(204),
})
export const rulerGroupMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "ruler_group_code_conflict",
      "ruler_group_in_use",
      "ruler_group_not_found",
      "ruler_group_precondition_failed",
      "ruler_group_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_ruler_group_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name"]),
          code: z.enum([
            "ruler_group_body_invalid",
            "ruler_group_code_invalid",
            "ruler_group_code_required",
            "ruler_group_code_too_long",
            "ruler_group_name_invalid",
            "ruler_group_name_required",
            "ruler_group_name_too_long",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

export const rulerSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
  group: rulerGroupOptionSchema.nullable(),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const rulerOptionSchema = rulerSchema.pick({
  id: true,
  code: true,
  name: true,
  group: true,
})
export const rulerListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const rulerListOutputSchema = z.object({
  data: z.array(rulerSchema),
  nextCursor: z.string().nullable(),
})
export const rulerOptionsInputSchema = rulerListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const rulerOptionsOutputSchema = z.object({
  data: z.array(rulerOptionSchema),
  nextCursor: z.string().nullable(),
})
export const rulerDetailInputSchema = z.object({ uuid: z.uuid() })
export const rulerDetailOutputSchema = z.object({ data: rulerSchema })
export const rulerMutationBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
  rulerGroupId: z.uuid().nullable(),
})
export const rulerCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: rulerMutationBodySchema,
})
export const rulerCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/rulers/"),
    etag: z.string(),
  }),
  body: rulerDetailOutputSchema,
})
export const rulerReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: rulerMutationBodySchema,
})
export const rulerReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: rulerDetailOutputSchema,
})
export const rulerDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const rulerDeleteOutputSchema = z.object({ status: z.literal(204) })
export const rulerMaintenanceProblemDocumentSchema =
  maintenanceProblemDocumentSchema.extend({
    code: z.enum([
      "authentication_required",
      "ruler_code_conflict",
      "ruler_group_not_found",
      "ruler_in_use",
      "ruler_not_found",
      "ruler_precondition_failed",
      "ruler_validation_failed",
      "editor_access_required",
      "idempotency_key_required",
      "idempotency_key_reused",
      "if_match_required",
      "internal_error",
      "invalid_ruler_uuid",
      "invalid_idempotency_key",
      "invalid_if_match",
      "invalid_json",
      "invalid_request",
      "method_not_allowed",
      "rate_limit_exceeded",
    ]),
    invalidParams: z
      .array(
        z.object({
          name: z.enum(["/", "/code", "/name", "/rulerGroupId"]),
          code: z.enum([
            "ruler_body_invalid",
            "ruler_code_invalid",
            "ruler_code_required",
            "ruler_code_too_long",
            "ruler_name_invalid",
            "ruler_name_required",
            "ruler_name_too_long",
            "ruler_ruler_group_id_invalid",
          ]),
          reason: z.string(),
        })
      )
      .optional(),
  })

const currencyCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const currencyNameSchema = z.string().trim().min(1).max(255)
const currencyFullNameSchema = z.string().trim().min(1).max(255)

export const currencySchema = z.object({
  id: z.uuid(),
  code: currencyCodeSchema,
  name: currencyNameSchema,
  fullName: currencyFullNameSchema,
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})
export const currencyOptionSchema = currencySchema.pick({
  id: true,
  code: true,
  name: true,
  fullName: true,
})
export const currencyListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["name", "fullName", "code"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export const currencyListOutputSchema = z.object({
  data: z.array(currencySchema),
  nextCursor: z.string().nullable(),
})
export const currencyOptionsInputSchema = currencyListInputSchema.pick({
  q: true,
  cursor: true,
  limit: true,
})
export const currencyOptionsOutputSchema = z.object({
  data: z.array(currencyOptionSchema),
  nextCursor: z.string().nullable(),
})
export const currencyDetailInputSchema = z.object({ uuid: z.uuid() })
export const currencyDetailOutputSchema = z.object({ data: currencySchema })
export const currencyMutationBodySchema = z.object({
  code: currencyCodeSchema,
  name: currencyNameSchema,
  fullName: currencyFullNameSchema,
})
export const currencyCreateInputSchema = z.object({
  headers: z.object({ "idempotency-key": idempotencyKeySchema }),
  body: currencyMutationBodySchema,
})
export const currencyCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/currencies/"),
    etag: z.string(),
  }),
  body: currencyDetailOutputSchema,
})
export const currencyReplaceInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
  body: currencyMutationBodySchema,
})
export const currencyReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: currencyDetailOutputSchema,
})
export const currencyDeleteInputSchema = z.object({
  params: z.object({ uuid: z.uuid() }),
  headers: z.object({ "if-match": ifMatchSchema }),
})
export const currencyDeleteOutputSchema = z.object({ status: z.literal(204) })

export const orientationDeleteOutputSchema = z.object({
  status: z.literal(204),
})

const maintenanceReadErrors = {
  BAD_REQUEST: { status: 400, data: maintenanceProblemDocumentSchema },
  UNAUTHORIZED: { status: 401, data: maintenanceProblemDocumentSchema },
  FORBIDDEN: { status: 403, data: maintenanceProblemDocumentSchema },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: maintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: maintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: maintenanceProblemDocumentSchema,
  },
} as const

const maintenanceMutationErrors = {
  ...maintenanceReadErrors,
  NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
  CONFLICT: { status: 409, data: maintenanceProblemDocumentSchema },
  PRECONDITION_FAILED: {
    status: 412,
    data: maintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: maintenanceProblemDocumentSchema,
  },
} as const

const edgeMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: { status: 409, data: edgeMaintenanceProblemDocumentSchema },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: edgeMaintenanceProblemDocumentSchema,
  },
} as const

const rimMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: { status: 409, data: rimMaintenanceProblemDocumentSchema },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: rimMaintenanceProblemDocumentSchema,
  },
} as const

const shapeMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: { status: 409, data: shapeMaintenanceProblemDocumentSchema },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: shapeMaintenanceProblemDocumentSchema,
  },
} as const

const engraverMaintenanceReadErrors = {
  BAD_REQUEST: {
    status: 400,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  FORBIDDEN: {
    status: 403,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: engraverMaintenanceProblemDocumentSchema,
  },
} as const

const engraverMaintenanceMutationErrors = {
  ...engraverMaintenanceReadErrors,
  NOT_FOUND: {
    status: 404,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  CONFLICT: { status: 409, data: engraverMaintenanceProblemDocumentSchema },
  PRECONDITION_FAILED: {
    status: 412,
    data: engraverMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: engraverMaintenanceProblemDocumentSchema,
  },
} as const

const themeMaintenanceReadErrors = {
  BAD_REQUEST: {
    status: 400,
    data: themeMaintenanceProblemDocumentSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    data: themeMaintenanceProblemDocumentSchema,
  },
  FORBIDDEN: {
    status: 403,
    data: themeMaintenanceProblemDocumentSchema,
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: themeMaintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: themeMaintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: themeMaintenanceProblemDocumentSchema,
  },
} as const

const themeMaintenanceMutationErrors = {
  ...themeMaintenanceReadErrors,
  NOT_FOUND: {
    status: 404,
    data: themeMaintenanceProblemDocumentSchema,
  },
  CONFLICT: { status: 409, data: themeMaintenanceProblemDocumentSchema },
  PRECONDITION_FAILED: {
    status: 412,
    data: themeMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: themeMaintenanceProblemDocumentSchema,
  },
} as const

const issuerMaintenanceReadErrors = {
  BAD_REQUEST: { status: 400, data: issuerMaintenanceProblemDocumentSchema },
  UNAUTHORIZED: { status: 401, data: issuerMaintenanceProblemDocumentSchema },
  FORBIDDEN: { status: 403, data: issuerMaintenanceProblemDocumentSchema },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: issuerMaintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: issuerMaintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: issuerMaintenanceProblemDocumentSchema,
  },
} as const

const issuerMaintenanceMutationErrors = {
  ...issuerMaintenanceReadErrors,
  NOT_FOUND: { status: 404, data: issuerMaintenanceProblemDocumentSchema },
  CONFLICT: { status: 409, data: issuerMaintenanceProblemDocumentSchema },
  PRECONDITION_FAILED: {
    status: 412,
    data: issuerMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: issuerMaintenanceProblemDocumentSchema,
  },
} as const

const mintMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: mintMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: mintMaintenanceProblemDocumentSchema,
  },
} as const

const mintingTechniqueMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: mintingTechniqueMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: mintingTechniqueMaintenanceProblemDocumentSchema,
  },
} as const

const rulerGroupMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: rulerGroupMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: rulerGroupMaintenanceProblemDocumentSchema,
  },
} as const

const rulerMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: { status: 409, data: rulerMaintenanceProblemDocumentSchema },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: rulerMaintenanceProblemDocumentSchema,
  },
} as const

const coinMaintenanceNamedOptionSchema = z.object({
  id: z.uuid(),
  code: codeSchema,
  name: z.string(),
})

export const coinMaintenanceListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  issuer: codeSchema.optional(),
  ruler: codeSchema.optional(),
  distribution: codeSchema.optional(),
  currency: codeSchema.optional(),
  composition: codeSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["updatedAt", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
})

export const coinMaintenanceListItemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  issuer: coinMaintenanceNamedOptionSchema,
  minYear: z.number().int().nullable(),
  maxYear: z.number().int().nullable(),
  faceValue: z.object({
    text: z.string(),
    currency: coinMaintenanceNamedOptionSchema,
  }),
  distribution: coinMaintenanceNamedOptionSchema,
  composition: coinMaintenanceNamedOptionSchema,
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
})

export const coinMaintenanceListOutputSchema = z.object({
  data: z.array(coinMaintenanceListItemSchema),
  nextCursor: z.string().nullable(),
})

const coinMaintenanceSurfaceSchema = z.object({
  description: z.string().nullable(),
  lettering: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
})

const coinMaintenanceFaceSurfaceSchema = coinMaintenanceSurfaceSchema.extend({
  engraverIds: z.array(z.uuid()),
})

export const coinMaintenanceDetailSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  comments: z.string().nullable(),
  compositionDescription: z.string().nullable(),
  compositionId: z.uuid(),
  currencyId: z.uuid(),
  diameter: decimalSchema.nullable(),
  distributionId: z.uuid(),
  edgeId: z.uuid().nullable(),
  faceValueNumericValue: decimalSchema,
  faceValueText: z.string(),
  isDemonetized: z.boolean().nullable(),
  issuerId: z.uuid(),
  maxYear: z.number().int().nullable(),
  mintIds: z.array(z.uuid()),
  minYear: z.number().int().nullable(),
  mintage: decimalSchema.nullable(),
  orientationId: z.uuid().nullable(),
  rimId: z.uuid().nullable(),
  rulerIds: z.array(z.uuid()),
  shapeId: z.uuid().nullable(),
  techniqueId: z.uuid().nullable(),
  themeIds: z.array(z.uuid()),
  thickness: decimalSchema.nullable(),
  weight: decimalSchema.nullable(),
  references: z.array(z.object({ catalogueId: z.uuid(), number: z.string() })),
  surfaces: z.object({
    obverse: coinMaintenanceFaceSurfaceSchema.nullable(),
    reverse: coinMaintenanceFaceSurfaceSchema.nullable(),
    edge: coinMaintenanceSurfaceSchema.nullable(),
  }),
  version: z.number().int().min(1),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
  etag: z.string().regex(/^"[A-Za-z0-9_-]+"$/),
})

export const coinMaintenanceDetailOutputSchema = z.object({
  data: coinMaintenanceDetailSchema,
})

const positiveDecimalSchema = (
  integerDigits: number,
  fractionalDigits: number
) =>
  z
    .string()
    .regex(
      new RegExp(
        `^(?:0|[1-9]\\d{0,${integerDigits - 1}})(?:\\.\\d{1,${fractionalDigits}})?$`
      )
    )
    .refine((value) => Number(value) > 0)
const positiveMeasurementSchema = positiveDecimalSchema(8, 2)
const nullablePositiveMeasurementSchema = positiveMeasurementSchema.nullable()
const coinMaintenanceCreateSurfaceSchema = z
  .object({
    description: z.string().trim().min(1).max(2000).nullable(),
    lettering: z.string().trim().min(1).max(4000).nullable(),
    imageUploadReference: z.string().trim().min(1).max(4096).nullable(),
  })
  .strict()
const coinMaintenanceCreateFaceSurfaceSchema =
  coinMaintenanceCreateSurfaceSchema
    .extend({ engraverIds: z.array(z.uuid()) })
    .strict()

export const coinMaintenanceCreateBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    comments: z.string().trim().min(1).nullable(),
    compositionDescription: z.string().trim().min(1).nullable(),
    compositionId: z.uuid(),
    currencyId: z.uuid(),
    diameter: nullablePositiveMeasurementSchema,
    distributionId: z.uuid(),
    edgeId: z.uuid().nullable(),
    faceValueNumericValue: positiveDecimalSchema(14, 6),
    faceValueText: z.string().trim().min(1).max(255),
    isDemonetized: z.boolean().nullable(),
    issuerId: z.uuid(),
    maxYear: z.number().int().min(-2_147_483_648).max(2_147_483_647).nullable(),
    mintIds: z.array(z.uuid()),
    minYear: z.number().int().min(-2_147_483_648).max(2_147_483_647).nullable(),
    mintage: z
      .string()
      .regex(/^\d+$/)
      .refine((value) => {
        const number = Number(value)
        return Number.isSafeInteger(number) && number > 0
      })
      .nullable(),
    orientationId: z.uuid().nullable(),
    rimId: z.uuid().nullable(),
    rulerIds: z.array(z.uuid()).min(1),
    shapeId: z.uuid().nullable(),
    techniqueId: z.uuid().nullable(),
    themeIds: z.array(z.uuid()),
    thickness: nullablePositiveMeasurementSchema,
    weight: nullablePositiveMeasurementSchema,
    references: z.array(
      z
        .object({ catalogueId: z.uuid(), number: z.string().trim().min(1) })
        .strict()
    ),
    surfaces: z
      .object({
        obverse: coinMaintenanceCreateFaceSurfaceSchema.nullable(),
        reverse: coinMaintenanceCreateFaceSurfaceSchema.nullable(),
        edge: coinMaintenanceCreateSurfaceSchema.nullable(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.minYear === null) !== (value.maxYear === null)) {
      context.addIssue({
        code: "custom",
        path: ["minYear"],
        message: "Issue Year Range requires both years or neither year.",
      })
    } else if (
      value.minYear !== null &&
      value.maxYear !== null &&
      value.minYear > value.maxYear
    ) {
      context.addIssue({
        code: "custom",
        path: ["minYear"],
        message: "Earliest Issue Year must not exceed Latest Issue Year.",
      })
    }

    for (const [field, identifiers] of [
      ["rulerIds", value.rulerIds],
      ["mintIds", value.mintIds],
      ["themeIds", value.themeIds],
      [
        "surfaces.obverse.engraverIds",
        value.surfaces.obverse?.engraverIds ?? [],
      ],
      [
        "surfaces.reverse.engraverIds",
        value.surfaces.reverse?.engraverIds ?? [],
      ],
    ] as const) {
      if (new Set(identifiers).size !== identifiers.length) {
        context.addIssue({
          code: "custom",
          path: field.split("."),
          message: "Duplicate relationship identifiers are not allowed.",
        })
      }
    }

    const references = new Set<string>()
    for (const [index, reference] of value.references.entries()) {
      const key = `${reference.catalogueId}:${reference.number.trim().replace(/\s+/g, " ").toLowerCase()}`
      if (references.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["references", index, "number"],
          message: "Duplicate Catalogue References are not allowed.",
        })
      }
      references.add(key)
    }
  })

export const coinMaintenanceCreateInputSchema = z
  .object({
    headers: z.object({ "idempotency-key": idempotencyKeySchema }).strict(),
    body: coinMaintenanceCreateBodySchema,
  })
  .strict()

const coinMaintenanceReplaceSurfaceSchema =
  coinMaintenanceCreateSurfaceSchema.safeExtend({
    imageUrl: z.string().url().nullable(),
  })
const coinMaintenanceReplaceFaceSurfaceSchema =
  coinMaintenanceReplaceSurfaceSchema
    .safeExtend({ engraverIds: z.array(z.uuid()) })
    .strict()
export const coinMaintenanceReplaceBodySchema =
  coinMaintenanceCreateBodySchema.safeExtend({
    surfaces: z
      .object({
        obverse: coinMaintenanceReplaceFaceSurfaceSchema.nullable(),
        reverse: coinMaintenanceReplaceFaceSurfaceSchema.nullable(),
        edge: coinMaintenanceReplaceSurfaceSchema.nullable(),
      })
      .strict(),
  })

export const coinMaintenanceCreateOutputSchema = z.object({
  status: z.literal(201),
  headers: z.object({
    location: z.string().startsWith("/api/v1/maintenance/coins/"),
    etag: z.string(),
  }),
  body: coinMaintenanceDetailOutputSchema,
})

export const coinMaintenanceReplaceInputSchema = z
  .object({
    params: z.object({ uuid: z.uuid() }).strict(),
    headers: z.object({ "if-match": ifMatchSchema }).strict(),
    body: coinMaintenanceReplaceBodySchema,
  })
  .strict()

export const coinMaintenanceReplaceOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({ etag: z.string() }),
  body: coinMaintenanceDetailOutputSchema,
})

export const coinMaintenanceDeleteInputSchema = z
  .object({
    params: z.object({ uuid: z.uuid() }).strict(),
    headers: z.object({ "if-match": ifMatchSchema }).strict(),
  })
  .strict()

export const coinMaintenanceDeleteOutputSchema = z.object({
  status: z.literal(204),
})

export const coinMaintenanceDeleteSummarySchema = z.object({
  title: z.string(),
  rulerAttributions: z.number().int().nonnegative(),
  mintAttributions: z.number().int().nonnegative(),
  themeAttributions: z.number().int().nonnegative(),
  catalogueReferences: z.number().int().nonnegative(),
  coinSurfaces: z.number().int().nonnegative(),
  engraverAttributions: z.number().int().nonnegative(),
})

export const coinMaintenanceDeleteSummaryOutputSchema = z.object({
  data: coinMaintenanceDeleteSummarySchema,
})

export const coinMaintenanceOptionsOutputSchema = z.object({
  data: z.object({
    catalogues: z.array(catalogueOptionSchema),
    compositions: z.array(compositionOptionSchema),
    currencies: z.array(currencyOptionSchema),
    distributions: z.array(distributionOptionSchema),
    edges: z.array(edgeOptionSchema),
    engravers: z.array(engraverOptionSchema),
    issuers: z.array(issuerOptionSchema),
    mints: z.array(mintOptionSchema),
    orientations: z.array(orientationOptionSchema),
    rims: z.array(rimOptionSchema),
    rulers: z.array(rulerOptionSchema),
    shapes: z.array(shapeOptionSchema),
    mintingTechniques: z.array(mintingTechniqueOptionSchema),
    themes: z.array(themeOptionSchema),
  }),
})

export const publicApiContract = {
  coins: {
    browse: oc
      .route({
        method: "GET",
        path: "/api/v1/coins",
        summary: "Browse Coins",
        tags: ["Coins"],
      })
      .input(browseCoinsInputSchema)
      .output(browseCoinsOutputSchema)
      .errors({
        BAD_REQUEST: { status: 400, data: problemDocumentSchema },
        METHOD_NOT_ALLOWED: { status: 405, data: problemDocumentSchema },
      }),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/coins/{uuid}",
        summary: "Get Coin detail",
        tags: ["Coins"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(coinDetailOutputSchema)
      .errors({
        BAD_REQUEST: { status: 400, data: problemDocumentSchema },
        NOT_FOUND: { status: 404, data: problemDocumentSchema },
        METHOD_NOT_ALLOWED: { status: 405, data: problemDocumentSchema },
      }),
  },
}

export const maintenanceApiContract = {
  coins: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/coins",
        summary: "Browse Coins for maintenance",
        tags: ["Coin Maintenance"],
      })
      .input(coinMaintenanceListInputSchema)
      .output(coinMaintenanceListOutputSchema)
      .errors(maintenanceReadErrors),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/coins",
        summary: "Create a complete Coin aggregate",
        tags: ["Coin Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(coinMaintenanceCreateInputSchema)
      .output(coinMaintenanceCreateOutputSchema)
      .errors(maintenanceMutationErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/coins/options",
        summary: "Get compact Coin Maintenance reference choices",
        tags: ["Coin Maintenance"],
      })
      .input(z.object({}))
      .output(coinMaintenanceOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/coins/{uuid}",
        summary: "Get editable Coin maintenance detail",
        tags: ["Coin Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(coinMaintenanceDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/coins/{uuid}",
        summary: "Replace a complete Coin aggregate",
        tags: ["Coin Maintenance"],
        successStatus: 200,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(coinMaintenanceReplaceInputSchema)
      .output(coinMaintenanceReplaceOutputSchema)
      .errors(maintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/coins/{uuid}",
        summary: "Permanently delete a Coin aggregate",
        tags: ["Coin Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(coinMaintenanceDeleteInputSchema)
      .output(coinMaintenanceDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
    deleteSummary: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/coins/{uuid}/deletion-summary",
        summary: "Get Coin deletion summary",
        tags: ["Coin Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(coinMaintenanceDeleteSummaryOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
  },
  surfaceImageUploads: {
    authorize: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/surface-image-uploads",
        summary: "Authorize a temporary Surface Image upload",
        tags: ["Surface Image Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(surfaceImageUploadAuthorizationInputSchema)
      .output(surfaceImageUploadAuthorizationOutputSchema)
      .errors(maintenanceMutationErrors),
    cancel: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/surface-image-uploads",
        summary: "Cancel a temporary Surface Image upload",
        tags: ["Surface Image Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(surfaceImageUploadCancellationInputSchema)
      .output(surfaceImageUploadCancellationOutputSchema)
      .errors(maintenanceMutationErrors),
  },
  overview: {
    get: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/overview",
        summary: "Get the Database Maintenance overview",
        tags: ["Database Maintenance"],
      })
      .input(z.object({}))
      .output(databaseMaintenanceOverviewOutputSchema)
      .errors(maintenanceReadErrors),
  },
  catalogues: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/catalogues",
        summary: "Browse Catalogues for maintenance",
        tags: ["Catalogue Maintenance"],
      })
      .input(catalogueListInputSchema)
      .output(catalogueListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/catalogues/options",
        summary: "Search compact Catalogue options",
        tags: ["Catalogue Maintenance"],
      })
      .input(catalogueOptionsInputSchema)
      .output(catalogueOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/catalogues/{uuid}",
        summary: "Get Catalogue maintenance detail",
        tags: ["Catalogue Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(catalogueDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/catalogues",
        summary: "Create a Catalogue",
        tags: ["Catalogue Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(catalogueCreateInputSchema)
      .output(catalogueCreateOutputSchema)
      .errors(maintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/catalogues/{uuid}",
        summary: "Replace a Catalogue",
        tags: ["Catalogue Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(catalogueReplaceInputSchema)
      .output(catalogueReplaceOutputSchema)
      .errors(maintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/catalogues/{uuid}",
        summary: "Permanently delete a Catalogue",
        tags: ["Catalogue Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(catalogueDeleteInputSchema)
      .output(catalogueDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
  },
  compositions: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/compositions",
        summary: "Browse Compositions for maintenance",
        tags: ["Composition Maintenance"],
      })
      .input(compositionListInputSchema)
      .output(compositionListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/compositions/options",
        summary: "Search compact Composition options",
        tags: ["Composition Maintenance"],
      })
      .input(compositionOptionsInputSchema)
      .output(compositionOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/compositions/{uuid}",
        summary: "Get Composition maintenance detail",
        tags: ["Composition Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(compositionDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/compositions",
        summary: "Create a Composition",
        tags: ["Composition Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(compositionCreateInputSchema)
      .output(compositionCreateOutputSchema)
      .errors(maintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/compositions/{uuid}",
        summary: "Replace a Composition",
        tags: ["Composition Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(compositionReplaceInputSchema)
      .output(compositionReplaceOutputSchema)
      .errors(maintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/compositions/{uuid}",
        summary: "Permanently delete a Composition",
        tags: ["Composition Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(compositionDeleteInputSchema)
      .output(compositionDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
  },
  distributions: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/distributions",
        summary: "Browse Distributions for maintenance",
        tags: ["Distribution Maintenance"],
      })
      .input(distributionListInputSchema)
      .output(distributionListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/distributions/options",
        summary: "Search compact Distribution options",
        tags: ["Distribution Maintenance"],
      })
      .input(distributionOptionsInputSchema)
      .output(distributionOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/distributions/{uuid}",
        summary: "Get Distribution maintenance detail",
        tags: ["Distribution Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(distributionDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/distributions",
        summary: "Create a Distribution",
        tags: ["Distribution Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(distributionCreateInputSchema)
      .output(distributionCreateOutputSchema)
      .errors(maintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/distributions/{uuid}",
        summary: "Replace a Distribution",
        tags: ["Distribution Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(distributionReplaceInputSchema)
      .output(distributionReplaceOutputSchema)
      .errors(maintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/distributions/{uuid}",
        summary: "Permanently delete a Distribution",
        tags: ["Distribution Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(distributionDeleteInputSchema)
      .output(distributionDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
  },
  edges: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/edges",
        summary: "Browse Edges for maintenance",
        tags: ["Edge Maintenance"],
      })
      .input(edgeListInputSchema)
      .output(edgeListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/edges/options",
        summary: "Search compact Edge options",
        tags: ["Edge Maintenance"],
      })
      .input(edgeOptionsInputSchema)
      .output(edgeOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/edges/{uuid}",
        summary: "Get Edge maintenance detail",
        tags: ["Edge Maintenance"],
      })
      .input(edgeDetailInputSchema)
      .output(edgeDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/edges",
        summary: "Create an Edge",
        tags: ["Edge Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(edgeCreateInputSchema)
      .output(edgeCreateOutputSchema)
      .errors(edgeMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/edges/{uuid}",
        summary: "Replace an Edge",
        tags: ["Edge Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(edgeReplaceInputSchema)
      .output(edgeReplaceOutputSchema)
      .errors(edgeMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/edges/{uuid}",
        summary: "Permanently delete an Edge",
        tags: ["Edge Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(edgeDeleteInputSchema)
      .output(edgeDeleteOutputSchema)
      .errors(edgeMaintenanceMutationErrors),
  },
  rims: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rims",
        summary: "Browse Rims for maintenance",
        tags: ["Rim Maintenance"],
      })
      .input(rimListInputSchema)
      .output(rimListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rims/options",
        summary: "Search compact Rim options",
        tags: ["Rim Maintenance"],
      })
      .input(rimOptionsInputSchema)
      .output(rimOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rims/{uuid}",
        summary: "Get Rim maintenance detail",
        tags: ["Rim Maintenance"],
      })
      .input(rimDetailInputSchema)
      .output(rimDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/rims",
        summary: "Create a Rim",
        tags: ["Rim Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rimCreateInputSchema)
      .output(rimCreateOutputSchema)
      .errors(rimMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/rims/{uuid}",
        summary: "Replace a Rim",
        tags: ["Rim Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rimReplaceInputSchema)
      .output(rimReplaceOutputSchema)
      .errors(rimMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/rims/{uuid}",
        summary: "Permanently delete a Rim",
        tags: ["Rim Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rimDeleteInputSchema)
      .output(rimDeleteOutputSchema)
      .errors(rimMaintenanceMutationErrors),
  },
  shapes: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/shapes",
        summary: "Browse Shapes for maintenance",
        tags: ["Shape Maintenance"],
      })
      .input(shapeListInputSchema)
      .output(shapeListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/shapes/options",
        summary: "Search compact Shape options",
        tags: ["Shape Maintenance"],
      })
      .input(shapeOptionsInputSchema)
      .output(shapeOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/shapes/{uuid}",
        summary: "Get Shape maintenance detail",
        tags: ["Shape Maintenance"],
      })
      .input(shapeDetailInputSchema)
      .output(shapeDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/shapes",
        summary: "Create a Shape",
        tags: ["Shape Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(shapeCreateInputSchema)
      .output(shapeCreateOutputSchema)
      .errors(shapeMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/shapes/{uuid}",
        summary: "Replace a Shape",
        tags: ["Shape Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(shapeReplaceInputSchema)
      .output(shapeReplaceOutputSchema)
      .errors(shapeMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/shapes/{uuid}",
        summary: "Permanently delete a Shape",
        tags: ["Shape Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(shapeDeleteInputSchema)
      .output(shapeDeleteOutputSchema)
      .errors(shapeMaintenanceMutationErrors),
  },
  engravers: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/engravers",
        summary: "Browse Engravers for maintenance",
        tags: ["Engraver Maintenance"],
      })
      .input(engraverListInputSchema)
      .output(engraverListOutputSchema)
      .errors(engraverMaintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/engravers/options",
        summary: "Search compact Engraver options",
        tags: ["Engraver Maintenance"],
      })
      .input(engraverOptionsInputSchema)
      .output(engraverOptionsOutputSchema)
      .errors(engraverMaintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/engravers/{uuid}",
        summary: "Get Engraver maintenance detail",
        tags: ["Engraver Maintenance"],
      })
      .input(engraverDetailInputSchema)
      .output(engraverDetailOutputSchema)
      .errors({
        ...engraverMaintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: engraverMaintenanceProblemDocumentSchema,
        },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/engravers",
        summary: "Create an Engraver",
        tags: ["Engraver Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(engraverCreateInputSchema)
      .output(engraverCreateOutputSchema)
      .errors(engraverMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/engravers/{uuid}",
        summary: "Replace an Engraver",
        tags: ["Engraver Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(engraverReplaceInputSchema)
      .output(engraverReplaceOutputSchema)
      .errors(engraverMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/engravers/{uuid}",
        summary: "Permanently delete an Engraver",
        tags: ["Engraver Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(engraverDeleteInputSchema)
      .output(engraverDeleteOutputSchema)
      .errors(engraverMaintenanceMutationErrors),
  },
  themes: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/themes",
        summary: "Browse Themes for maintenance",
        tags: ["Theme Maintenance"],
      })
      .input(themeListInputSchema)
      .output(themeListOutputSchema)
      .errors(themeMaintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/themes/options",
        summary: "Search compact Theme options",
        tags: ["Theme Maintenance"],
      })
      .input(themeOptionsInputSchema)
      .output(themeOptionsOutputSchema)
      .errors(themeMaintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/themes/{uuid}",
        summary: "Get Theme maintenance detail",
        tags: ["Theme Maintenance"],
      })
      .input(themeDetailInputSchema)
      .output(themeDetailOutputSchema)
      .errors({
        ...themeMaintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: themeMaintenanceProblemDocumentSchema,
        },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/themes",
        summary: "Create a Theme",
        tags: ["Theme Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(themeCreateInputSchema)
      .output(themeCreateOutputSchema)
      .errors(themeMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/themes/{uuid}",
        summary: "Replace a Theme",
        tags: ["Theme Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(themeReplaceInputSchema)
      .output(themeReplaceOutputSchema)
      .errors(themeMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/themes/{uuid}",
        summary: "Permanently delete a Theme",
        tags: ["Theme Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(themeDeleteInputSchema)
      .output(themeDeleteOutputSchema)
      .errors(themeMaintenanceMutationErrors),
  },
  issuers: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/issuers",
        summary: "Browse Issuers for maintenance",
        tags: ["Issuer Maintenance"],
      })
      .input(issuerListInputSchema)
      .output(issuerListOutputSchema)
      .errors(issuerMaintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/issuers/options",
        summary: "Search compact Issuer options",
        tags: ["Issuer Maintenance"],
      })
      .input(issuerOptionsInputSchema)
      .output(issuerOptionsOutputSchema)
      .errors(issuerMaintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/issuers/{uuid}",
        summary: "Get Issuer maintenance detail",
        tags: ["Issuer Maintenance"],
      })
      .input(issuerDetailInputSchema)
      .output(issuerDetailOutputSchema)
      .errors({
        ...issuerMaintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: issuerMaintenanceProblemDocumentSchema,
        },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/issuers",
        summary: "Create an Issuer",
        tags: ["Issuer Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(issuerCreateInputSchema)
      .output(issuerCreateOutputSchema)
      .errors(issuerMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/issuers/{uuid}",
        summary: "Replace an Issuer",
        tags: ["Issuer Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(issuerReplaceInputSchema)
      .output(issuerReplaceOutputSchema)
      .errors(issuerMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/issuers/{uuid}",
        summary: "Permanently delete an Issuer",
        tags: ["Issuer Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(issuerDeleteInputSchema)
      .output(issuerDeleteOutputSchema)
      .errors(issuerMaintenanceMutationErrors),
  },
  mintingTechniques: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/minting-techniques",
        summary: "Browse Minting Techniques for maintenance",
        tags: ["Minting Technique Maintenance"],
      })
      .input(mintingTechniqueListInputSchema)
      .output(mintingTechniqueListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/minting-techniques/options",
        summary: "Search compact Minting Technique options",
        tags: ["Minting Technique Maintenance"],
      })
      .input(mintingTechniqueOptionsInputSchema)
      .output(mintingTechniqueOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/minting-techniques/{uuid}",
        summary: "Get Minting Technique maintenance detail",
        tags: ["Minting Technique Maintenance"],
      })
      .input(mintingTechniqueDetailInputSchema)
      .output(mintingTechniqueDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/minting-techniques",
        summary: "Create a Minting Technique",
        tags: ["Minting Technique Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(mintingTechniqueCreateInputSchema)
      .output(mintingTechniqueCreateOutputSchema)
      .errors(mintingTechniqueMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/minting-techniques/{uuid}",
        summary: "Replace a Minting Technique",
        tags: ["Minting Technique Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(mintingTechniqueReplaceInputSchema)
      .output(mintingTechniqueReplaceOutputSchema)
      .errors(mintingTechniqueMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/minting-techniques/{uuid}",
        summary: "Permanently delete a Minting Technique",
        tags: ["Minting Technique Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(mintingTechniqueDeleteInputSchema)
      .output(mintingTechniqueDeleteOutputSchema)
      .errors(mintingTechniqueMaintenanceMutationErrors),
  },
  mints: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/mints",
        summary: "Browse Mints for maintenance",
        tags: ["Mint Maintenance"],
      })
      .input(mintListInputSchema)
      .output(mintListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/mints/options",
        summary: "Search compact Mint options",
        tags: ["Mint Maintenance"],
      })
      .input(mintOptionsInputSchema)
      .output(mintOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/mints/{uuid}",
        summary: "Get Mint maintenance detail",
        tags: ["Mint Maintenance"],
      })
      .input(mintDetailInputSchema)
      .output(mintDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/mints",
        summary: "Create a Mint",
        tags: ["Mint Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(mintCreateInputSchema)
      .output(mintCreateOutputSchema)
      .errors(mintMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/mints/{uuid}",
        summary: "Replace a Mint",
        tags: ["Mint Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(mintReplaceInputSchema)
      .output(mintReplaceOutputSchema)
      .errors(mintMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/mints/{uuid}",
        summary: "Permanently delete a Mint",
        tags: ["Mint Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(mintDeleteInputSchema)
      .output(mintDeleteOutputSchema)
      .errors(mintMaintenanceMutationErrors),
  },
  rulerGroups: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/ruler-groups",
        summary: "Browse Ruler Groups for maintenance",
        tags: ["Ruler Group Maintenance"],
      })
      .input(rulerGroupListInputSchema)
      .output(rulerGroupListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/ruler-groups/options",
        summary: "Search compact Ruler Group options",
        tags: ["Ruler Group Maintenance"],
      })
      .input(rulerGroupOptionsInputSchema)
      .output(rulerGroupOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/ruler-groups/{uuid}",
        summary: "Get Ruler Group maintenance detail",
        tags: ["Ruler Group Maintenance"],
      })
      .input(rulerGroupDetailInputSchema)
      .output(rulerGroupDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/ruler-groups",
        summary: "Create a Ruler Group",
        tags: ["Ruler Group Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rulerGroupCreateInputSchema)
      .output(rulerGroupCreateOutputSchema)
      .errors(rulerGroupMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/ruler-groups/{uuid}",
        summary: "Replace a Ruler Group",
        tags: ["Ruler Group Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rulerGroupReplaceInputSchema)
      .output(rulerGroupReplaceOutputSchema)
      .errors(rulerGroupMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/ruler-groups/{uuid}",
        summary: "Permanently delete a Ruler Group",
        tags: ["Ruler Group Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rulerGroupDeleteInputSchema)
      .output(rulerGroupDeleteOutputSchema)
      .errors(rulerGroupMaintenanceMutationErrors),
  },
  rulers: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rulers",
        summary: "Browse Rulers for maintenance",
        tags: ["Ruler Maintenance"],
      })
      .input(rulerListInputSchema)
      .output(rulerListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rulers/options",
        summary: "Search compact Ruler options",
        tags: ["Ruler Maintenance"],
      })
      .input(rulerOptionsInputSchema)
      .output(rulerOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rulers/{uuid}",
        summary: "Get Ruler maintenance detail",
        tags: ["Ruler Maintenance"],
      })
      .input(rulerDetailInputSchema)
      .output(rulerDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/rulers",
        summary: "Create a Ruler",
        tags: ["Ruler Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rulerCreateInputSchema)
      .output(rulerCreateOutputSchema)
      .errors(rulerMaintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/rulers/{uuid}",
        summary: "Replace a Ruler",
        tags: ["Ruler Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rulerReplaceInputSchema)
      .output(rulerReplaceOutputSchema)
      .errors(rulerMaintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/rulers/{uuid}",
        summary: "Permanently delete a Ruler",
        tags: ["Ruler Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(rulerDeleteInputSchema)
      .output(rulerDeleteOutputSchema)
      .errors(rulerMaintenanceMutationErrors),
  },
  currencies: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/currencies",
        summary: "Browse Currencies for maintenance",
        tags: ["Currency Maintenance"],
      })
      .input(currencyListInputSchema)
      .output(currencyListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/currencies/options",
        summary: "Search compact Currency options",
        tags: ["Currency Maintenance"],
      })
      .input(currencyOptionsInputSchema)
      .output(currencyOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/currencies/{uuid}",
        summary: "Get Currency maintenance detail",
        tags: ["Currency Maintenance"],
      })
      .input(currencyDetailInputSchema)
      .output(currencyDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/currencies",
        summary: "Create a Currency",
        tags: ["Currency Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(currencyCreateInputSchema)
      .output(currencyCreateOutputSchema)
      .errors(maintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/currencies/{uuid}",
        summary: "Replace a Currency",
        tags: ["Currency Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(currencyReplaceInputSchema)
      .output(currencyReplaceOutputSchema)
      .errors(maintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/currencies/{uuid}",
        summary: "Permanently delete a Currency",
        tags: ["Currency Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(currencyDeleteInputSchema)
      .output(currencyDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
  },
  orientations: {
    list: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/orientations",
        summary: "Browse Orientations for maintenance",
        tags: ["Orientation Maintenance"],
      })
      .input(orientationListInputSchema)
      .output(orientationListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/orientations/options",
        summary: "Search compact Orientation options",
        tags: ["Orientation Maintenance"],
      })
      .input(orientationOptionsInputSchema)
      .output(orientationOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/orientations/{uuid}",
        summary: "Get Orientation maintenance detail",
        tags: ["Orientation Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(orientationDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: { status: 404, data: maintenanceProblemDocumentSchema },
      }),
    create: oc
      .route({
        method: "POST",
        path: "/api/v1/maintenance/orientations",
        summary: "Create an Orientation",
        tags: ["Orientation Maintenance"],
        successStatus: 201,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(orientationCreateInputSchema)
      .output(orientationCreateOutputSchema)
      .errors(maintenanceMutationErrors),
    replace: oc
      .route({
        method: "PUT",
        path: "/api/v1/maintenance/orientations/{uuid}",
        summary: "Replace an Orientation",
        tags: ["Orientation Maintenance"],
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(orientationReplaceInputSchema)
      .output(orientationReplaceOutputSchema)
      .errors(maintenanceMutationErrors),
    delete: oc
      .route({
        method: "DELETE",
        path: "/api/v1/maintenance/orientations/{uuid}",
        summary: "Permanently delete an Orientation",
        tags: ["Orientation Maintenance"],
        successStatus: 204,
        inputStructure: "detailed",
        outputStructure: "detailed",
      })
      .input(orientationDeleteInputSchema)
      .output(orientationDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
  },
}

export const apiContract = {
  ...publicApiContract,
  maintenance: maintenanceApiContract,
}

export type BrowseCoinsInput = z.infer<typeof browseCoinsInputSchema>
export type BrowseCoinsOutput = z.infer<typeof browseCoinsOutputSchema>
export type CoinDetail = z.infer<typeof coinDetailSchema>
export type CoinDetailOutput = z.infer<typeof coinDetailOutputSchema>
export type CoinMaintenanceListInput = z.infer<
  typeof coinMaintenanceListInputSchema
>
export type CoinMaintenanceListItem = z.infer<
  typeof coinMaintenanceListItemSchema
>
export type CoinMaintenanceListOutput = z.infer<
  typeof coinMaintenanceListOutputSchema
>
export type CoinMaintenanceDetail = z.infer<typeof coinMaintenanceDetailSchema>
export type CoinMaintenanceDetailOutput = z.infer<
  typeof coinMaintenanceDetailOutputSchema
>
export type CoinMaintenanceCreateBody = z.infer<
  typeof coinMaintenanceCreateBodySchema
>
export type CoinMaintenanceCreateInput = z.infer<
  typeof coinMaintenanceCreateInputSchema
>
export type CoinMaintenanceReplaceInput = z.infer<
  typeof coinMaintenanceReplaceInputSchema
>
export type CoinMaintenanceReplaceBody = z.infer<
  typeof coinMaintenanceReplaceBodySchema
>
export type CoinMaintenanceDeleteSummary = z.infer<
  typeof coinMaintenanceDeleteSummarySchema
>
export type CoinMaintenanceDeleteSummaryOutput = z.infer<
  typeof coinMaintenanceDeleteSummaryOutputSchema
>
export type CoinMaintenanceOptionsOutput = z.infer<
  typeof coinMaintenanceOptionsOutputSchema
>
export type DatabaseMaintenanceOverview = z.infer<
  typeof databaseMaintenanceOverviewSchema
>
export type DatabaseMaintenanceOverviewOutput = z.infer<
  typeof databaseMaintenanceOverviewOutputSchema
>
export type Orientation = z.infer<typeof orientationSchema>
export type OrientationOption = z.infer<typeof orientationOptionSchema>
export type OrientationListInput = z.infer<typeof orientationListInputSchema>
export type OrientationListOutput = z.infer<typeof orientationListOutputSchema>
export type OrientationOptionsInput = z.infer<
  typeof orientationOptionsInputSchema
>
export type OrientationOptionsOutput = z.infer<
  typeof orientationOptionsOutputSchema
>
export type OrientationDetailOutput = z.infer<
  typeof orientationDetailOutputSchema
>
export type OrientationMutationBody = z.infer<
  typeof orientationMutationBodySchema
>
export type Catalogue = z.infer<typeof catalogueSchema>
export type CatalogueOption = z.infer<typeof catalogueOptionSchema>
export type CatalogueListInput = z.infer<typeof catalogueListInputSchema>
export type CatalogueListOutput = z.infer<typeof catalogueListOutputSchema>
export type CatalogueOptionsInput = z.infer<typeof catalogueOptionsInputSchema>
export type CatalogueOptionsOutput = z.infer<
  typeof catalogueOptionsOutputSchema
>
export type CatalogueDetailOutput = z.infer<typeof catalogueDetailOutputSchema>
export type CatalogueMutationBody = z.infer<typeof catalogueMutationBodySchema>
export type Composition = z.infer<typeof compositionSchema>
export type CompositionOption = z.infer<typeof compositionOptionSchema>
export type CompositionListInput = z.infer<typeof compositionListInputSchema>
export type CompositionListOutput = z.infer<typeof compositionListOutputSchema>
export type CompositionOptionsInput = z.infer<
  typeof compositionOptionsInputSchema
>
export type CompositionOptionsOutput = z.infer<
  typeof compositionOptionsOutputSchema
>
export type CompositionDetailOutput = z.infer<
  typeof compositionDetailOutputSchema
>
export type CompositionMutationBody = z.infer<
  typeof compositionMutationBodySchema
>
export type Distribution = z.infer<typeof distributionSchema>
export type DistributionOption = z.infer<typeof distributionOptionSchema>
export type DistributionListInput = z.infer<typeof distributionListInputSchema>
export type DistributionListOutput = z.infer<
  typeof distributionListOutputSchema
>
export type DistributionOptionsInput = z.infer<
  typeof distributionOptionsInputSchema
>
export type DistributionOptionsOutput = z.infer<
  typeof distributionOptionsOutputSchema
>
export type DistributionDetailOutput = z.infer<
  typeof distributionDetailOutputSchema
>
export type DistributionMutationBody = z.infer<
  typeof distributionMutationBodySchema
>
export type Edge = z.infer<typeof edgeSchema>
export type EdgeOption = z.infer<typeof edgeOptionSchema>
export type EdgeListInput = z.infer<typeof edgeListInputSchema>
export type EdgeListOutput = z.infer<typeof edgeListOutputSchema>
export type EdgeOptionsInput = z.infer<typeof edgeOptionsInputSchema>
export type EdgeOptionsOutput = z.infer<typeof edgeOptionsOutputSchema>
export type EdgeDetailOutput = z.infer<typeof edgeDetailOutputSchema>
export type EdgeMutationBody = z.infer<typeof edgeMutationBodySchema>
export type Rim = z.infer<typeof rimSchema>
export type RimOption = z.infer<typeof rimOptionSchema>
export type RimListInput = z.infer<typeof rimListInputSchema>
export type RimListOutput = z.infer<typeof rimListOutputSchema>
export type RimOptionsInput = z.infer<typeof rimOptionsInputSchema>
export type RimOptionsOutput = z.infer<typeof rimOptionsOutputSchema>
export type RimDetailOutput = z.infer<typeof rimDetailOutputSchema>
export type RimMutationBody = z.infer<typeof rimMutationBodySchema>
export type Shape = z.infer<typeof shapeSchema>
export type ShapeOption = z.infer<typeof shapeOptionSchema>
export type ShapeListInput = z.infer<typeof shapeListInputSchema>
export type ShapeListOutput = z.infer<typeof shapeListOutputSchema>
export type ShapeOptionsInput = z.infer<typeof shapeOptionsInputSchema>
export type ShapeOptionsOutput = z.infer<typeof shapeOptionsOutputSchema>
export type ShapeDetailOutput = z.infer<typeof shapeDetailOutputSchema>
export type ShapeMutationBody = z.infer<typeof shapeMutationBodySchema>
export type Engraver = z.infer<typeof engraverSchema>
export type EngraverOption = z.infer<typeof engraverOptionSchema>
export type EngraverListInput = z.infer<typeof engraverListInputSchema>
export type EngraverListOutput = z.infer<typeof engraverListOutputSchema>
export type EngraverOptionsInput = z.infer<typeof engraverOptionsInputSchema>
export type EngraverOptionsOutput = z.infer<typeof engraverOptionsOutputSchema>
export type EngraverDetailOutput = z.infer<typeof engraverDetailOutputSchema>
export type EngraverMutationBody = z.infer<typeof engraverMutationBodySchema>
export type Theme = z.infer<typeof themeSchema>
export type ThemeOption = z.infer<typeof themeOptionSchema>
export type ThemeListInput = z.infer<typeof themeListInputSchema>
export type ThemeListOutput = z.infer<typeof themeListOutputSchema>
export type ThemeOptionsInput = z.infer<typeof themeOptionsInputSchema>
export type ThemeOptionsOutput = z.infer<typeof themeOptionsOutputSchema>
export type ThemeDetailOutput = z.infer<typeof themeDetailOutputSchema>
export type ThemeMutationBody = z.infer<typeof themeMutationBodySchema>
export type Issuer = z.infer<typeof issuerSchema>
export type IssuerOption = z.infer<typeof issuerOptionSchema>
export type IssuerListInput = z.infer<typeof issuerListInputSchema>
export type IssuerListOutput = z.infer<typeof issuerListOutputSchema>
export type IssuerOptionsInput = z.infer<typeof issuerOptionsInputSchema>
export type IssuerOptionsOutput = z.infer<typeof issuerOptionsOutputSchema>
export type IssuerDetailOutput = z.infer<typeof issuerDetailOutputSchema>
export type IssuerMutationBody = z.infer<typeof issuerMutationBodySchema>
export type Mint = z.infer<typeof mintSchema>
export type MintOption = z.infer<typeof mintOptionSchema>
export type MintListInput = z.infer<typeof mintListInputSchema>
export type MintListOutput = z.infer<typeof mintListOutputSchema>
export type MintOptionsInput = z.infer<typeof mintOptionsInputSchema>
export type MintOptionsOutput = z.infer<typeof mintOptionsOutputSchema>
export type MintDetailOutput = z.infer<typeof mintDetailOutputSchema>
export type MintMutationBody = z.infer<typeof mintMutationBodySchema>
export type MintingTechnique = z.infer<typeof mintingTechniqueSchema>
export type MintingTechniqueOption = z.infer<
  typeof mintingTechniqueOptionSchema
>
export type MintingTechniqueListInput = z.infer<
  typeof mintingTechniqueListInputSchema
>
export type MintingTechniqueListOutput = z.infer<
  typeof mintingTechniqueListOutputSchema
>
export type MintingTechniqueOptionsInput = z.infer<
  typeof mintingTechniqueOptionsInputSchema
>
export type MintingTechniqueOptionsOutput = z.infer<
  typeof mintingTechniqueOptionsOutputSchema
>
export type MintingTechniqueDetailOutput = z.infer<
  typeof mintingTechniqueDetailOutputSchema
>
export type MintingTechniqueMutationBody = z.infer<
  typeof mintingTechniqueMutationBodySchema
>
export type RulerGroup = z.infer<typeof rulerGroupSchema>
export type RulerGroupOption = z.infer<typeof rulerGroupOptionSchema>
export type RulerGroupListInput = z.infer<typeof rulerGroupListInputSchema>
export type RulerGroupListOutput = z.infer<typeof rulerGroupListOutputSchema>
export type RulerGroupOptionsInput = z.infer<
  typeof rulerGroupOptionsInputSchema
>
export type RulerGroupOptionsOutput = z.infer<
  typeof rulerGroupOptionsOutputSchema
>
export type RulerGroupDetailOutput = z.infer<
  typeof rulerGroupDetailOutputSchema
>
export type RulerGroupMutationBody = z.infer<
  typeof rulerGroupMutationBodySchema
>
export type Ruler = z.infer<typeof rulerSchema>
export type RulerOption = z.infer<typeof rulerOptionSchema>
export type RulerListInput = z.infer<typeof rulerListInputSchema>
export type RulerListOutput = z.infer<typeof rulerListOutputSchema>
export type RulerOptionsInput = z.infer<typeof rulerOptionsInputSchema>
export type RulerOptionsOutput = z.infer<typeof rulerOptionsOutputSchema>
export type RulerDetailOutput = z.infer<typeof rulerDetailOutputSchema>
export type RulerMutationBody = z.infer<typeof rulerMutationBodySchema>
export type Currency = z.infer<typeof currencySchema>
export type CurrencyOption = z.infer<typeof currencyOptionSchema>
export type CurrencyListInput = z.infer<typeof currencyListInputSchema>
export type CurrencyListOutput = z.infer<typeof currencyListOutputSchema>
export type CurrencyOptionsInput = z.infer<typeof currencyOptionsInputSchema>
export type CurrencyOptionsOutput = z.infer<typeof currencyOptionsOutputSchema>
export type CurrencyDetailOutput = z.infer<typeof currencyDetailOutputSchema>
export type CurrencyMutationBody = z.infer<typeof currencyMutationBodySchema>
