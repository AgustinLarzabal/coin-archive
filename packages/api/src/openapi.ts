import { OpenAPIGenerator } from "@orpc/openapi"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"

import { apiContract } from "./api-contract"

export async function generateApiOpenApiDocument() {
  const document = await new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  }).generate(apiContract, {
    info: { title: "Coin Archive API", version: "1.0.0" },
  })

  applyOperationSecurity(document)
  applyMaintenanceProblemMediaTypes(document)

  return document
}

function applyOperationSecurity(document: unknown) {
  const mutableDocument = document as {
    components?: { securitySchemes?: Record<string, unknown> }
    paths?: Record<
      string,
      Record<
        string,
        { security?: Array<Record<string, never[]>> } | null | undefined
      >
    >
  }
  mutableDocument.components ??= {}
  mutableDocument.components.securitySchemes ??= {}
  mutableDocument.components.securitySchemes.collectorSession = {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
  }

  for (const [path, pathItem] of Object.entries(mutableDocument.paths ?? {})) {
    for (const operation of Object.values(pathItem)) {
      if (operation === null || operation === undefined) continue
      operation.security = path.startsWith("/api/v1/maintenance/")
        ? [{ collectorSession: [] }]
        : []
    }
  }
}

function applyMaintenanceProblemMediaTypes(document: unknown) {
  const mutableDocument = document as {
    paths?: Record<
      string,
      Record<
        string,
        | {
            responses?: Record<
              string,
              { content?: Record<string, unknown> } | null | undefined
            >
          }
        | null
        | undefined
      >
    >
  }

  for (const [path, pathItem] of Object.entries(mutableDocument.paths ?? {})) {
    if (!path.startsWith("/api/v1/maintenance/")) continue

    for (const operation of Object.values(pathItem)) {
      if (operation === null || operation === undefined) continue

      for (const [status, response] of Object.entries(
        operation.responses ?? {}
      )) {
        if (Number(status) < 400 || response?.content === undefined) continue

        const problemSchema = response.content["application/json"]
        if (problemSchema === undefined) continue

        delete response.content["application/json"]
        response.content["application/problem+json"] = problemSchema
      }
    }
  }
}
