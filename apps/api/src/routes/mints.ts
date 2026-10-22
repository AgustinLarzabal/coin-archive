import { mintListResponseSchema, mintResponseSchema } from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { MintListResponse } from "@coin-archive/api"
import type { IssuerRecord, MintRecord } from "@coin-archive/db"

const route = createRoute({
  method: "get",
  path: "/v1/mints",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: mintListResponseSchema
            .safeExtend({ mints: z.array(mintResponseSchema.openapi("Mint")) })
            .openapi("MintListResponse"),
        },
      },
      description: "Every Mint ordered by name then slug",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Mints",
      headers: responseHeaders,
    },
  },
})

export function registerMintRoutes(
  app: ApiApp,
  options: {
    listMints?: () => Promise<Array<MintRecord & { country: IssuerRecord }>>
  }
) {
  app.openapi(route, async (context) => {
    const mints = await (options.listMints ?? (async () => []))()
    const response = {
      mints: mints.map(
        ({
          id,
          slug,
          name,
          place,
          country,
          startYear,
          endYear,
          operating,
        }) => ({
          id,
          slug,
          name,
          place,
          country: { code: country.code, name: country.name },
          startYear,
          endYear,
          operating,
        })
      ),
    } satisfies MintListResponse
    return context.json(response, 200)
  })
}
