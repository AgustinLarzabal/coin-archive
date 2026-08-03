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
const ifMatchSchema = z.string().trim().min(1)

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
export type Currency = z.infer<typeof currencySchema>
export type CurrencyOption = z.infer<typeof currencyOptionSchema>
export type CurrencyListInput = z.infer<typeof currencyListInputSchema>
export type CurrencyListOutput = z.infer<typeof currencyListOutputSchema>
export type CurrencyOptionsInput = z.infer<typeof currencyOptionsInputSchema>
export type CurrencyOptionsOutput = z.infer<typeof currencyOptionsOutputSchema>
export type CurrencyDetailOutput = z.infer<typeof currencyDetailOutputSchema>
export type CurrencyMutationBody = z.infer<typeof currencyMutationBodySchema>
