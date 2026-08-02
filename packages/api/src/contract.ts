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
