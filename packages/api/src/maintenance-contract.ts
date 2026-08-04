import { oc } from "@orpc/contract"
import { z } from "zod"

import * as schemas from "./contract"

const maintenanceReadErrors = {
  BAD_REQUEST: { status: 400, data: schemas.maintenanceProblemDocumentSchema },
  UNAUTHORIZED: { status: 401, data: schemas.maintenanceProblemDocumentSchema },
  FORBIDDEN: { status: 403, data: schemas.maintenanceProblemDocumentSchema },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: schemas.maintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: schemas.maintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: schemas.maintenanceProblemDocumentSchema,
  },
} as const

const maintenanceMutationErrors = {
  ...maintenanceReadErrors,
  NOT_FOUND: { status: 404, data: schemas.maintenanceProblemDocumentSchema },
  CONFLICT: { status: 409, data: schemas.maintenanceProblemDocumentSchema },
  PRECONDITION_FAILED: {
    status: 412,
    data: schemas.maintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.maintenanceProblemDocumentSchema,
  },
} as const

const edgeMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: { status: 409, data: schemas.edgeMaintenanceProblemDocumentSchema },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.edgeMaintenanceProblemDocumentSchema,
  },
} as const

const rimMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: { status: 409, data: schemas.rimMaintenanceProblemDocumentSchema },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.rimMaintenanceProblemDocumentSchema,
  },
} as const

const shapeMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: schemas.shapeMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.shapeMaintenanceProblemDocumentSchema,
  },
} as const

const engraverMaintenanceReadErrors = {
  BAD_REQUEST: {
    status: 400,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  FORBIDDEN: {
    status: 403,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
} as const

const engraverMaintenanceMutationErrors = {
  ...engraverMaintenanceReadErrors,
  NOT_FOUND: {
    status: 404,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  CONFLICT: {
    status: 409,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  PRECONDITION_FAILED: {
    status: 412,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.engraverMaintenanceProblemDocumentSchema,
  },
} as const

const themeMaintenanceReadErrors = {
  BAD_REQUEST: {
    status: 400,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  FORBIDDEN: {
    status: 403,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
} as const

const themeMaintenanceMutationErrors = {
  ...themeMaintenanceReadErrors,
  NOT_FOUND: {
    status: 404,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  CONFLICT: {
    status: 409,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  PRECONDITION_FAILED: {
    status: 412,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.themeMaintenanceProblemDocumentSchema,
  },
} as const

const issuerMaintenanceReadErrors = {
  BAD_REQUEST: {
    status: 400,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  FORBIDDEN: {
    status: 403,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
} as const

const issuerMaintenanceMutationErrors = {
  ...issuerMaintenanceReadErrors,
  NOT_FOUND: {
    status: 404,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  CONFLICT: {
    status: 409,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  PRECONDITION_FAILED: {
    status: 412,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.issuerMaintenanceProblemDocumentSchema,
  },
} as const

const mintMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: schemas.mintMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.mintMaintenanceProblemDocumentSchema,
  },
} as const

const mintingTechniqueMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: schemas.mintingTechniqueMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.mintingTechniqueMaintenanceProblemDocumentSchema,
  },
} as const

const rulerGroupMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: schemas.rulerGroupMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.rulerGroupMaintenanceProblemDocumentSchema,
  },
} as const

const rulerMaintenanceMutationErrors = {
  ...maintenanceMutationErrors,
  CONFLICT: {
    status: 409,
    data: schemas.rulerMaintenanceProblemDocumentSchema,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    data: schemas.rulerMaintenanceProblemDocumentSchema,
  },
} as const

const coinMaintenanceNamedOptionSchema = z.object({
  id: z.uuid(),
  code: schemas.codeSchema,
  name: z.string(),
})

export const coinMaintenanceListInputSchema = z.object({
  q: z.string().trim().min(1).optional(),
  issuer: schemas.codeSchema.optional(),
  ruler: schemas.codeSchema.optional(),
  distribution: schemas.codeSchema.optional(),
  currency: schemas.codeSchema.optional(),
  composition: schemas.codeSchema.optional(),
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
  createdAt: schemas.utcTimestampSchema,
  updatedAt: schemas.utcTimestampSchema,
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
  diameter: schemas.decimalSchema.nullable(),
  distributionId: z.uuid(),
  edgeId: z.uuid().nullable(),
  faceValueNumericValue: schemas.decimalSchema,
  faceValueText: z.string(),
  isDemonetized: z.boolean().nullable(),
  issuerId: z.uuid(),
  maxYear: z.number().int().nullable(),
  mintIds: z.array(z.uuid()),
  minYear: z.number().int().nullable(),
  mintage: schemas.decimalSchema.nullable(),
  orientationId: z.uuid().nullable(),
  rimId: z.uuid().nullable(),
  rulerIds: z.array(z.uuid()),
  shapeId: z.uuid().nullable(),
  techniqueId: z.uuid().nullable(),
  themeIds: z.array(z.uuid()),
  thickness: schemas.decimalSchema.nullable(),
  weight: schemas.decimalSchema.nullable(),
  references: z.array(z.object({ catalogueId: z.uuid(), number: z.string() })),
  surfaces: z.object({
    obverse: coinMaintenanceFaceSurfaceSchema.nullable(),
    reverse: coinMaintenanceFaceSurfaceSchema.nullable(),
    edge: coinMaintenanceSurfaceSchema.nullable(),
  }),
  version: z.number().int().min(1),
  createdAt: schemas.utcTimestampSchema,
  updatedAt: schemas.utcTimestampSchema,
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
    headers: z
      .object({ "idempotency-key": schemas.idempotencyKeySchema })
      .strict(),
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
    headers: z.object({ "if-match": schemas.ifMatchSchema }).strict(),
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
    headers: z.object({ "if-match": schemas.ifMatchSchema }).strict(),
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
    catalogues: z.array(schemas.catalogueOptionSchema),
    compositions: z.array(schemas.compositionOptionSchema),
    currencies: z.array(schemas.currencyOptionSchema),
    distributions: z.array(schemas.distributionOptionSchema),
    edges: z.array(schemas.edgeOptionSchema),
    engravers: z.array(schemas.engraverOptionSchema),
    issuers: z.array(schemas.issuerOptionSchema),
    mints: z.array(schemas.mintOptionSchema),
    orientations: z.array(schemas.orientationOptionSchema),
    rims: z.array(schemas.rimOptionSchema),
    rulers: z.array(schemas.rulerOptionSchema),
    shapes: z.array(schemas.shapeOptionSchema),
    mintingTechniques: z.array(schemas.mintingTechniqueOptionSchema),
    themes: z.array(schemas.themeOptionSchema),
  }),
})

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
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.surfaceImageUploadAuthorizationInputSchema)
      .output(schemas.surfaceImageUploadAuthorizationOutputSchema)
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
      .input(schemas.surfaceImageUploadCancellationInputSchema)
      .output(schemas.surfaceImageUploadCancellationOutputSchema)
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
      .output(schemas.databaseMaintenanceOverviewOutputSchema)
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
      .input(schemas.catalogueListInputSchema)
      .output(schemas.catalogueListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/catalogues/options",
        summary: "Search compact Catalogue options",
        tags: ["Catalogue Maintenance"],
      })
      .input(schemas.catalogueOptionsInputSchema)
      .output(schemas.catalogueOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/catalogues/{uuid}",
        summary: "Get Catalogue maintenance detail",
        tags: ["Catalogue Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(schemas.catalogueDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.catalogueCreateInputSchema)
      .output(schemas.catalogueCreateOutputSchema)
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
      .input(schemas.catalogueReplaceInputSchema)
      .output(schemas.catalogueReplaceOutputSchema)
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
      .input(schemas.catalogueDeleteInputSchema)
      .output(schemas.catalogueDeleteOutputSchema)
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
      .input(schemas.compositionListInputSchema)
      .output(schemas.compositionListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/compositions/options",
        summary: "Search compact Composition options",
        tags: ["Composition Maintenance"],
      })
      .input(schemas.compositionOptionsInputSchema)
      .output(schemas.compositionOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/compositions/{uuid}",
        summary: "Get Composition maintenance detail",
        tags: ["Composition Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(schemas.compositionDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.compositionCreateInputSchema)
      .output(schemas.compositionCreateOutputSchema)
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
      .input(schemas.compositionReplaceInputSchema)
      .output(schemas.compositionReplaceOutputSchema)
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
      .input(schemas.compositionDeleteInputSchema)
      .output(schemas.compositionDeleteOutputSchema)
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
      .input(schemas.distributionListInputSchema)
      .output(schemas.distributionListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/distributions/options",
        summary: "Search compact Distribution options",
        tags: ["Distribution Maintenance"],
      })
      .input(schemas.distributionOptionsInputSchema)
      .output(schemas.distributionOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/distributions/{uuid}",
        summary: "Get Distribution maintenance detail",
        tags: ["Distribution Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(schemas.distributionDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.distributionCreateInputSchema)
      .output(schemas.distributionCreateOutputSchema)
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
      .input(schemas.distributionReplaceInputSchema)
      .output(schemas.distributionReplaceOutputSchema)
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
      .input(schemas.distributionDeleteInputSchema)
      .output(schemas.distributionDeleteOutputSchema)
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
      .input(schemas.edgeListInputSchema)
      .output(schemas.edgeListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/edges/options",
        summary: "Search compact Edge options",
        tags: ["Edge Maintenance"],
      })
      .input(schemas.edgeOptionsInputSchema)
      .output(schemas.edgeOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/edges/{uuid}",
        summary: "Get Edge maintenance detail",
        tags: ["Edge Maintenance"],
      })
      .input(schemas.edgeDetailInputSchema)
      .output(schemas.edgeDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.edgeCreateInputSchema)
      .output(schemas.edgeCreateOutputSchema)
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
      .input(schemas.edgeReplaceInputSchema)
      .output(schemas.edgeReplaceOutputSchema)
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
      .input(schemas.edgeDeleteInputSchema)
      .output(schemas.edgeDeleteOutputSchema)
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
      .input(schemas.rimListInputSchema)
      .output(schemas.rimListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rims/options",
        summary: "Search compact Rim options",
        tags: ["Rim Maintenance"],
      })
      .input(schemas.rimOptionsInputSchema)
      .output(schemas.rimOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rims/{uuid}",
        summary: "Get Rim maintenance detail",
        tags: ["Rim Maintenance"],
      })
      .input(schemas.rimDetailInputSchema)
      .output(schemas.rimDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.rimCreateInputSchema)
      .output(schemas.rimCreateOutputSchema)
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
      .input(schemas.rimReplaceInputSchema)
      .output(schemas.rimReplaceOutputSchema)
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
      .input(schemas.rimDeleteInputSchema)
      .output(schemas.rimDeleteOutputSchema)
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
      .input(schemas.shapeListInputSchema)
      .output(schemas.shapeListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/shapes/options",
        summary: "Search compact Shape options",
        tags: ["Shape Maintenance"],
      })
      .input(schemas.shapeOptionsInputSchema)
      .output(schemas.shapeOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/shapes/{uuid}",
        summary: "Get Shape maintenance detail",
        tags: ["Shape Maintenance"],
      })
      .input(schemas.shapeDetailInputSchema)
      .output(schemas.shapeDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.shapeCreateInputSchema)
      .output(schemas.shapeCreateOutputSchema)
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
      .input(schemas.shapeReplaceInputSchema)
      .output(schemas.shapeReplaceOutputSchema)
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
      .input(schemas.shapeDeleteInputSchema)
      .output(schemas.shapeDeleteOutputSchema)
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
      .input(schemas.engraverListInputSchema)
      .output(schemas.engraverListOutputSchema)
      .errors(engraverMaintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/engravers/options",
        summary: "Search compact Engraver options",
        tags: ["Engraver Maintenance"],
      })
      .input(schemas.engraverOptionsInputSchema)
      .output(schemas.engraverOptionsOutputSchema)
      .errors(engraverMaintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/engravers/{uuid}",
        summary: "Get Engraver maintenance detail",
        tags: ["Engraver Maintenance"],
      })
      .input(schemas.engraverDetailInputSchema)
      .output(schemas.engraverDetailOutputSchema)
      .errors({
        ...engraverMaintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.engraverMaintenanceProblemDocumentSchema,
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
      .input(schemas.engraverCreateInputSchema)
      .output(schemas.engraverCreateOutputSchema)
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
      .input(schemas.engraverReplaceInputSchema)
      .output(schemas.engraverReplaceOutputSchema)
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
      .input(schemas.engraverDeleteInputSchema)
      .output(schemas.engraverDeleteOutputSchema)
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
      .input(schemas.themeListInputSchema)
      .output(schemas.themeListOutputSchema)
      .errors(themeMaintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/themes/options",
        summary: "Search compact Theme options",
        tags: ["Theme Maintenance"],
      })
      .input(schemas.themeOptionsInputSchema)
      .output(schemas.themeOptionsOutputSchema)
      .errors(themeMaintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/themes/{uuid}",
        summary: "Get Theme maintenance detail",
        tags: ["Theme Maintenance"],
      })
      .input(schemas.themeDetailInputSchema)
      .output(schemas.themeDetailOutputSchema)
      .errors({
        ...themeMaintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.themeMaintenanceProblemDocumentSchema,
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
      .input(schemas.themeCreateInputSchema)
      .output(schemas.themeCreateOutputSchema)
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
      .input(schemas.themeReplaceInputSchema)
      .output(schemas.themeReplaceOutputSchema)
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
      .input(schemas.themeDeleteInputSchema)
      .output(schemas.themeDeleteOutputSchema)
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
      .input(schemas.issuerListInputSchema)
      .output(schemas.issuerListOutputSchema)
      .errors(issuerMaintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/issuers/options",
        summary: "Search compact Issuer options",
        tags: ["Issuer Maintenance"],
      })
      .input(schemas.issuerOptionsInputSchema)
      .output(schemas.issuerOptionsOutputSchema)
      .errors(issuerMaintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/issuers/{uuid}",
        summary: "Get Issuer maintenance detail",
        tags: ["Issuer Maintenance"],
      })
      .input(schemas.issuerDetailInputSchema)
      .output(schemas.issuerDetailOutputSchema)
      .errors({
        ...issuerMaintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.issuerMaintenanceProblemDocumentSchema,
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
      .input(schemas.issuerCreateInputSchema)
      .output(schemas.issuerCreateOutputSchema)
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
      .input(schemas.issuerReplaceInputSchema)
      .output(schemas.issuerReplaceOutputSchema)
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
      .input(schemas.issuerDeleteInputSchema)
      .output(schemas.issuerDeleteOutputSchema)
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
      .input(schemas.mintingTechniqueListInputSchema)
      .output(schemas.mintingTechniqueListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/minting-techniques/options",
        summary: "Search compact Minting Technique options",
        tags: ["Minting Technique Maintenance"],
      })
      .input(schemas.mintingTechniqueOptionsInputSchema)
      .output(schemas.mintingTechniqueOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/minting-techniques/{uuid}",
        summary: "Get Minting Technique maintenance detail",
        tags: ["Minting Technique Maintenance"],
      })
      .input(schemas.mintingTechniqueDetailInputSchema)
      .output(schemas.mintingTechniqueDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.mintingTechniqueCreateInputSchema)
      .output(schemas.mintingTechniqueCreateOutputSchema)
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
      .input(schemas.mintingTechniqueReplaceInputSchema)
      .output(schemas.mintingTechniqueReplaceOutputSchema)
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
      .input(schemas.mintingTechniqueDeleteInputSchema)
      .output(schemas.mintingTechniqueDeleteOutputSchema)
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
      .input(schemas.mintListInputSchema)
      .output(schemas.mintListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/mints/options",
        summary: "Search compact Mint options",
        tags: ["Mint Maintenance"],
      })
      .input(schemas.mintOptionsInputSchema)
      .output(schemas.mintOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/mints/{uuid}",
        summary: "Get Mint maintenance detail",
        tags: ["Mint Maintenance"],
      })
      .input(schemas.mintDetailInputSchema)
      .output(schemas.mintDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.mintCreateInputSchema)
      .output(schemas.mintCreateOutputSchema)
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
      .input(schemas.mintReplaceInputSchema)
      .output(schemas.mintReplaceOutputSchema)
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
      .input(schemas.mintDeleteInputSchema)
      .output(schemas.mintDeleteOutputSchema)
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
      .input(schemas.rulerGroupListInputSchema)
      .output(schemas.rulerGroupListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/ruler-groups/options",
        summary: "Search compact Ruler Group options",
        tags: ["Ruler Group Maintenance"],
      })
      .input(schemas.rulerGroupOptionsInputSchema)
      .output(schemas.rulerGroupOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/ruler-groups/{uuid}",
        summary: "Get Ruler Group maintenance detail",
        tags: ["Ruler Group Maintenance"],
      })
      .input(schemas.rulerGroupDetailInputSchema)
      .output(schemas.rulerGroupDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.rulerGroupCreateInputSchema)
      .output(schemas.rulerGroupCreateOutputSchema)
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
      .input(schemas.rulerGroupReplaceInputSchema)
      .output(schemas.rulerGroupReplaceOutputSchema)
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
      .input(schemas.rulerGroupDeleteInputSchema)
      .output(schemas.rulerGroupDeleteOutputSchema)
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
      .input(schemas.rulerListInputSchema)
      .output(schemas.rulerListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rulers/options",
        summary: "Search compact Ruler options",
        tags: ["Ruler Maintenance"],
      })
      .input(schemas.rulerOptionsInputSchema)
      .output(schemas.rulerOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/rulers/{uuid}",
        summary: "Get Ruler maintenance detail",
        tags: ["Ruler Maintenance"],
      })
      .input(schemas.rulerDetailInputSchema)
      .output(schemas.rulerDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.rulerCreateInputSchema)
      .output(schemas.rulerCreateOutputSchema)
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
      .input(schemas.rulerReplaceInputSchema)
      .output(schemas.rulerReplaceOutputSchema)
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
      .input(schemas.rulerDeleteInputSchema)
      .output(schemas.rulerDeleteOutputSchema)
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
      .input(schemas.currencyListInputSchema)
      .output(schemas.currencyListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/currencies/options",
        summary: "Search compact Currency options",
        tags: ["Currency Maintenance"],
      })
      .input(schemas.currencyOptionsInputSchema)
      .output(schemas.currencyOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/currencies/{uuid}",
        summary: "Get Currency maintenance detail",
        tags: ["Currency Maintenance"],
      })
      .input(schemas.currencyDetailInputSchema)
      .output(schemas.currencyDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.currencyCreateInputSchema)
      .output(schemas.currencyCreateOutputSchema)
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
      .input(schemas.currencyReplaceInputSchema)
      .output(schemas.currencyReplaceOutputSchema)
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
      .input(schemas.currencyDeleteInputSchema)
      .output(schemas.currencyDeleteOutputSchema)
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
      .input(schemas.orientationListInputSchema)
      .output(schemas.orientationListOutputSchema)
      .errors(maintenanceReadErrors),
    options: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/orientations/options",
        summary: "Search compact Orientation options",
        tags: ["Orientation Maintenance"],
      })
      .input(schemas.orientationOptionsInputSchema)
      .output(schemas.orientationOptionsOutputSchema)
      .errors(maintenanceReadErrors),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/maintenance/orientations/{uuid}",
        summary: "Get Orientation maintenance detail",
        tags: ["Orientation Maintenance"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(schemas.orientationDetailOutputSchema)
      .errors({
        ...maintenanceReadErrors,
        NOT_FOUND: {
          status: 404,
          data: schemas.maintenanceProblemDocumentSchema,
        },
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
      .input(schemas.orientationCreateInputSchema)
      .output(schemas.orientationCreateOutputSchema)
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
      .input(schemas.orientationReplaceInputSchema)
      .output(schemas.orientationReplaceOutputSchema)
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
      .input(schemas.orientationDeleteInputSchema)
      .output(schemas.orientationDeleteOutputSchema)
      .errors(maintenanceMutationErrors),
  },
}

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
