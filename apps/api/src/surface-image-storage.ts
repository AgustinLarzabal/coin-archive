import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto"
import { AwsClient } from "aws4fetch"

export const SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS = 5 * 60
const SURFACE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

type Surface = "obverse" | "reverse" | "edge"
type Upload = {
  surface: Surface
  contentType: string
  contentLength: number
}
type Configuration = {
  accessKeyId: string
  bucket: string
  endpoint: string
  secretAccessKey: string
}
type ReferencePayload = Upload & {
  expiresAt: number
  objectKey: string
}

export type SurfaceImageUploadObjectStorage = {
  createPresignedPutUrl: (input: {
    contentType: string
    objectKey: string
  }) => Promise<string>
  deleteObject: (objectKey: string) => Promise<void>
}

export type SurfaceImageUploadStorage = {
  authorizeUpload: (upload: Upload) => Promise<{
    reference: string
    uploadUrl: string
    expiresAt: Date
  }>
  cancelUpload: (reference: string, surface: Surface) => Promise<void>
}

export class SurfaceImageUploadReferenceError extends Error {
  constructor(
    readonly reason: "expired" | "invalid",
    message: string
  ) {
    super(message)
    this.name = "SurfaceImageUploadReferenceError"
  }
}

export function createR2SurfaceImageUploadStorage(
  configuration: Configuration,
  objectStorage = createS3ObjectStorage(configuration),
  {
    now = () => Date.now(),
    createObjectId = () => randomUUID(),
  }: { now?: () => number; createObjectId?: () => string } = {}
): SurfaceImageUploadStorage {
  return {
    async authorizeUpload(upload) {
      assertAcceptedUpload(upload)
      const expiresAt = now() + SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS * 1000
      const objectKey = `surface-images/temporary/${createObjectId()}`
      const reference = createReference(
        { ...upload, objectKey, expiresAt },
        configuration.secretAccessKey
      )
      const uploadUrl = await objectStorage.createPresignedPutUrl({
        objectKey,
        contentType: upload.contentType,
      })

      return { reference, uploadUrl, expiresAt: new Date(expiresAt) }
    },

    async cancelUpload(reference, surface) {
      const payload = parseReference(reference, configuration.secretAccessKey)
      if (payload.expiresAt < now()) {
        throw new SurfaceImageUploadReferenceError(
          "expired",
          "Surface Image upload reference has expired."
        )
      }
      if (payload.surface !== surface) {
        throw new SurfaceImageUploadReferenceError(
          "invalid",
          "Surface Image upload reference is not authorized for this Surface."
        )
      }
      await objectStorage.deleteObject(payload.objectKey)
    },
  }
}

function assertAcceptedUpload(upload: Upload) {
  if (!ALLOWED_CONTENT_TYPES.has(upload.contentType)) {
    throw new Error("Surface Images must be JPEG, PNG, or WebP files.")
  }
  if (
    !Number.isSafeInteger(upload.contentLength) ||
    upload.contentLength <= 0
  ) {
    throw new Error("Surface Image files must not be empty.")
  }
  if (upload.contentLength > SURFACE_IMAGE_MAX_BYTES) {
    throw new Error("Surface Images must be 10 MB or smaller.")
  }
}

function createReference(payload: ReferencePayload, secret: string) {
  const initializationVector = randomBytes(12)
  const cipher = createCipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    initializationVector
  )
  const encryptedPayload = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])
  return [
    initializationVector.toString("base64url"),
    encryptedPayload.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
  ].join(".")
}

function parseReference(reference: string, secret: string): ReferencePayload {
  const [initializationVector, encryptedPayload, authTag, extra] =
    reference.split(".")
  if (!initializationVector || !encryptedPayload || !authTag || extra) {
    throw new Error("Surface Image upload reference is invalid.")
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      createHash("sha256").update(secret).digest(),
      Buffer.from(initializationVector, "base64url")
    )
    decipher.setAuthTag(Buffer.from(authTag, "base64url"))
    const payload: unknown = JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(encryptedPayload, "base64url")),
        decipher.final(),
      ]).toString("utf8")
    )
    if (!isReferencePayload(payload)) throw new Error()
    assertAcceptedUpload(payload)
    if (!payload.objectKey.startsWith("surface-images/temporary/")) {
      throw new Error()
    }
    return payload
  } catch {
    throw new SurfaceImageUploadReferenceError(
      "invalid",
      "Surface Image upload reference is invalid."
    )
  }
}

function isReferencePayload(value: unknown): value is ReferencePayload {
  if (typeof value !== "object" || value === null) return false
  const payload = value as Partial<ReferencePayload>
  return (
    typeof payload.objectKey === "string" &&
    typeof payload.contentType === "string" &&
    ["obverse", "reverse", "edge"].includes(payload.surface ?? "") &&
    Number.isSafeInteger(payload.contentLength) &&
    Number.isSafeInteger(payload.expiresAt)
  )
}

function createS3ObjectStorage(
  configuration: Configuration
): SurfaceImageUploadObjectStorage {
  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: configuration.accessKeyId,
    secretAccessKey: configuration.secretAccessKey,
  })
  const objectUrl = (objectKey: string) =>
    new URL(
      `${configuration.bucket}/${objectKey}`,
      `${configuration.endpoint}/`
    )

  return {
    async createPresignedPutUrl({ objectKey, contentType }) {
      const url = objectUrl(objectKey)
      url.searchParams.set(
        "X-Amz-Expires",
        String(SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS)
      )
      const request = await client.sign(
        new Request(url, {
          method: "PUT",
          headers: { "Content-Type": contentType },
        }),
        { aws: { signQuery: true, allHeaders: true } }
      )
      return request.url.toString()
    },
    async deleteObject(objectKey) {
      const response = await client.fetch(
        new Request(objectUrl(objectKey), { method: "DELETE" })
      )
      if (!response.ok && response.status !== 404) {
        throw new Error(
          `R2 object storage request failed with status ${response.status}.`
        )
      }
    },
  }
}
