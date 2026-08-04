import { z } from "zod"

export const codeSchema = z.string().min(1)
const namedCodeSchema = z.object({ code: codeSchema, name: z.string() })
export const decimalSchema = z.string().regex(/^-?\d+(?:\.\d+)?$/)
export const utcTimestampSchema = z.iso.datetime()

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

export const idempotencyKeySchema = z.string().trim().min(1).max(255)
export const ifMatchSchema = z
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

export type BrowseCoinsInput = z.infer<typeof browseCoinsInputSchema>
export type BrowseCoinsOutput = z.infer<typeof browseCoinsOutputSchema>
export type CoinDetail = z.infer<typeof coinDetailSchema>
export type CoinDetailOutput = z.infer<typeof coinDetailOutputSchema>
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
