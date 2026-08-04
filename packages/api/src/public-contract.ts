import { oc } from "@orpc/contract"
import { z } from "zod"

import * as schemas from "./contract"

export const publicApiContract = {
  coins: {
    browse: oc
      .route({
        method: "GET",
        path: "/api/v1/coins",
        summary: "Browse Coins",
        tags: ["Coins"],
      })
      .input(schemas.browseCoinsInputSchema)
      .output(schemas.browseCoinsOutputSchema)
      .errors({
        BAD_REQUEST: { status: 400, data: schemas.problemDocumentSchema },
        METHOD_NOT_ALLOWED: {
          status: 405,
          data: schemas.problemDocumentSchema,
        },
      }),
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/coins/{uuid}",
        summary: "Get Coin detail",
        tags: ["Coins"],
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(schemas.coinDetailOutputSchema)
      .errors({
        BAD_REQUEST: { status: 400, data: schemas.problemDocumentSchema },
        NOT_FOUND: { status: 404, data: schemas.problemDocumentSchema },
        METHOD_NOT_ALLOWED: {
          status: 405,
          data: schemas.problemDocumentSchema,
        },
      }),
  },
}
