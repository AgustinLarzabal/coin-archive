import { internalErrorSchema as sharedInternalErrorSchema } from "@workspace/api"
import type { OpenAPIHono } from "@hono/zod-openapi"

export type AppEnvironment = {
  Variables: {
    requestId: string
  }
}

export type ApiApp = OpenAPIHono<AppEnvironment>

export const responseHeaders = {
  "Cache-Control": {
    description: "Prevents caching of operational state",
    schema: { type: "string" as const, enum: ["no-store"] },
  },
  "x-request-id": {
    description: "Request correlation identifier",
    schema: { type: "string" as const, minLength: 1, maxLength: 128 },
  },
}

export const internalErrorSchema =
  sharedInternalErrorSchema.openapi("InternalError")
