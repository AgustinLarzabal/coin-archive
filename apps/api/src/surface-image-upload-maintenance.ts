import {
  surfaceImageUploadAuthorizationInputSchema,
  surfaceImageUploadCancellationInputSchema,
} from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"
import { SurfaceImageUploadReferenceError } from "./surface-image-storage"

type Surface = "obverse" | "reverse" | "edge"
type Upload = {
  surface: Surface
  contentType: "image/jpeg" | "image/png" | "image/webp"
  contentLength: number
}
type Authorization = {
  reference: string
  uploadUrl: string
  expiresAt: Date
}

export type SurfaceImageUploadMaintenanceDependencies = {
  authorizeSurfaceImageUpload: (input: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    upload: Upload
  }) => Promise<
    | { status: "created" | "replayed"; authorization: Authorization }
    | { status: "mismatch" }
  >
  cancelSurfaceImageUpload: (input: {
    surface: Surface
    reference: string
  }) => Promise<void>
}

type Env = { Variables: { collector: MaintenanceCollector; requestId: string } }

export function registerSurfaceImageUploadMaintenanceRoutes(
  app: Hono<Env>,
  dependencies: SurfaceImageUploadMaintenanceDependencies
) {
  app.post("/api/v1/maintenance/surface-image-uploads", async (context) => {
    const idempotencyKey = context.req.header("idempotency-key")?.trim()
    if (!idempotencyKey) {
      return problem(
        context.req.path,
        400,
        "idempotency-key-required",
        "idempotency_key_required",
        "Idempotency-Key required",
        "Surface Image upload authorization requires an Idempotency-Key header"
      )
    }

    const body = await readJson(context.req.raw)
    if (body instanceof Response) return body
    const parsed = surfaceImageUploadAuthorizationInputSchema.safeParse({
      headers: { "idempotency-key": idempotencyKey },
      body,
    })
    if (!parsed.success) {
      return problem(
        context.req.path,
        idempotencyKey.length > 255 ? 400 : 422,
        "surface-image-upload-validation-failed",
        "surface_image_upload_validation_failed",
        "Invalid Surface Image upload",
        "Surface Image upload metadata is invalid"
      )
    }

    const result = await dependencies.authorizeSurfaceImageUpload({
      collectorId: context.get("collector").id,
      idempotencyKey: parsed.data.headers["idempotency-key"],
      requestHash: await digest(JSON.stringify(parsed.data.body)),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      upload: parsed.data.body,
    })
    if (result.status === "mismatch") {
      return problem(
        context.req.path,
        409,
        "idempotency-key-reuse",
        "idempotency_key_reused",
        "Idempotency-Key already used",
        "This Idempotency-Key was already used with different upload metadata"
      )
    }

    return context.json(
      {
        reference: result.authorization.reference,
        uploadUrl: result.authorization.uploadUrl,
        expiresAt: result.authorization.expiresAt.toISOString(),
      },
      201
    )
  })

  app.delete("/api/v1/maintenance/surface-image-uploads", async (context) => {
    const body = await readJson(context.req.raw)
    if (body instanceof Response) return body
    const parsed = surfaceImageUploadCancellationInputSchema.safeParse({ body })
    if (!parsed.success) {
      return problem(
        context.req.path,
        422,
        "surface-image-upload-validation-failed",
        "surface_image_upload_validation_failed",
        "Invalid Surface Image upload cancellation",
        "Surface Image upload cancellation metadata is invalid"
      )
    }

    try {
      await dependencies.cancelSurfaceImageUpload(parsed.data.body)
      return context.body(null, 204)
    } catch (error) {
      if (error instanceof SurfaceImageUploadReferenceError) {
        const expired = error.reason === "expired"
        return problem(
          context.req.path,
          422,
          expired
            ? "surface-image-upload-expired"
            : "surface-image-upload-reference-invalid",
          expired
            ? "surface_image_upload_expired"
            : "surface_image_upload_reference_invalid",
          expired
            ? "Surface Image upload expired"
            : "Invalid Surface Image upload reference",
          expired
            ? "The temporary Surface Image upload authorization has expired"
            : "The temporary Surface Image upload reference is invalid"
        )
      }
      throw error
    }
  })

  app.all("/api/v1/maintenance/surface-image-uploads", (context) =>
    problem(
      context.req.path,
      405,
      "method-not-allowed",
      "method_not_allowed",
      "Method Not Allowed",
      "Only POST and DELETE are supported",
      { Allow: "POST, DELETE" }
    )
  )
}

async function readJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json()
  } catch {
    return problem(
      new URL(request.url).pathname,
      400,
      "invalid-json",
      "invalid_json",
      "Invalid JSON",
      "Request body must be valid JSON"
    )
  }
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  )
  return Buffer.from(hash).toString("base64url")
}

function problem(
  instance: string,
  status: number,
  slug: string,
  code: string,
  title: string,
  detail: string,
  headers: Record<string, string> = {}
) {
  return new Response(
    JSON.stringify({
      type: `https://api.coinarchive.app/problems/${slug}`,
      title,
      status,
      detail,
      instance,
      code,
    }),
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "application/problem+json",
        ...headers,
      },
    }
  )
}
