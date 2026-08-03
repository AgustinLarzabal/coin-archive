import "@tanstack/react-start/server-only"
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto"
import { AwsClient } from "aws4fetch"

export const SURFACE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS = 5 * 60

const ALLOWED_SURFACE_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

type Surface = "obverse" | "reverse" | "edge"

export type SurfaceImageUploadRequest = {
  contentLength: number
  contentType: string
  surface: Surface
}

export type SurfaceImageUploadAuthorization = {
  reference: string
  uploadUrl: string
}

export type ResolvedSurfaceImage = { imageUrl: string }

export type SurfaceImageStorage = {
  authorizeUpload: (
    input: SurfaceImageUploadRequest
  ) => Promise<SurfaceImageUploadAuthorization>
  resolveUpload: (
    reference: string,
    surface: Surface
  ) => Promise<ResolvedSurfaceImage>
  deletePublishedImage: (imageUrl: string) => Promise<void>
  deleteUpload: (reference: string, surface: Surface) => Promise<void>
}

export type SurfaceImageObjectStorage = {
  inspectObject: (objectKey: string) => Promise<{
    contentLength: number | undefined
    contentType: string | undefined
    firstBytes: Uint8Array
  }>
  createPresignedPutUrl: (input: {
    contentLength: number
    contentType: string
    objectKey: string
  }) => Promise<string>
  deleteObject: (objectKey: string) => Promise<void>
  moveObject: (
    sourceObjectKey: string,
    destinationObjectKey: string
  ) => Promise<void>
}

type R2Configuration = {
  accessKeyId: string
  bucket: string
  endpoint: string
  publicBaseUrl: string
  secretAccessKey: string
}

type UploadReferencePayload = {
  contentLength: number
  contentType: string
  expiresAt: number
  objectKey: string
  surface: Surface
}

function getRequiredEnvironment(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required R2 configuration: ${name}.`)
  }

  return value
}

export function getR2Configuration(): R2Configuration {
  return {
    endpoint: getRequiredEnvironment("R2_ENDPOINT"),
    bucket: getRequiredEnvironment("R2_BUCKET"),
    accessKeyId: getRequiredEnvironment("R2_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnvironment("R2_SECRET_ACCESS_KEY"),
    publicBaseUrl: getRequiredEnvironment("R2_PUBLIC_BASE_URL"),
  }
}

function assertAcceptedUploadRequest(input: SurfaceImageUploadRequest) {
  if (!ALLOWED_SURFACE_IMAGE_CONTENT_TYPES.has(input.contentType)) {
    throw new Error("Surface Images must be JPEG, PNG, or WebP files.")
  }

  if (!Number.isSafeInteger(input.contentLength) || input.contentLength <= 0) {
    throw new Error("Surface Image files must not be empty.")
  }

  if (input.contentLength > SURFACE_IMAGE_MAX_BYTES) {
    throw new Error("Surface Images must be 10 MB or smaller.")
  }
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function createUploadReference(
  payload: UploadReferencePayload,
  secret: string
) {
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
    encodeBase64Url(initializationVector),
    encodeBase64Url(encryptedPayload),
    encodeBase64Url(cipher.getAuthTag()),
  ].join(".")
}

function parseUploadReference(reference: string, secret: string) {
  const [
    encodedInitializationVector,
    encryptedPayload,
    encodedAuthTag,
    extraPart,
  ] = reference.split(".")

  if (
    !encodedInitializationVector ||
    !encryptedPayload ||
    !encodedAuthTag ||
    extraPart
  ) {
    throw new Error("Surface Image upload reference is invalid.")
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      createHash("sha256").update(secret).digest(),
      Buffer.from(encodedInitializationVector, "base64url")
    )
    decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64url"))
    const payload = JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(encryptedPayload, "base64url")),
        decipher.final(),
      ]).toString("utf8")
    ) as UploadReferencePayload

    if (
      typeof payload.objectKey !== "string" ||
      typeof payload.contentType !== "string" ||
      !["obverse", "reverse", "edge"].includes(payload.surface) ||
      !Number.isSafeInteger(payload.contentLength) ||
      !Number.isSafeInteger(payload.expiresAt)
    ) {
      throw new Error()
    }

    assertAcceptedUploadRequest({
      surface: payload.surface,
      contentLength: payload.contentLength,
      contentType: payload.contentType,
    })

    if (payload.expiresAt < Date.now()) {
      throw new Error("Surface Image upload reference has expired.")
    }

    return payload
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Surface Image")) {
      throw error
    }

    throw new Error("Surface Image upload reference is invalid.")
  }
}

function hasExpectedImageSignature(contentType: string, bytes: Uint8Array) {
  if (contentType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    )
  }

  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    )
  }

  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
}

function createS3ObjectStorage(
  configuration: R2Configuration
): SurfaceImageObjectStorage {
  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: configuration.accessKeyId,
    secretAccessKey: configuration.secretAccessKey,
  })
  const getObjectUrl = (objectKey: string) =>
    new URL(
      `${configuration.bucket}/${objectKey}`,
      `${configuration.endpoint}/`
    )

  async function assertSuccessfulResponse(response: Response) {
    if (response.ok) return

    throw new Error(
      `R2 object storage request failed with status ${response.status}.`
    )
  }

  return {
    async createPresignedPutUrl(input) {
      const url = getObjectUrl(input.objectKey)
      url.searchParams.set(
        "X-Amz-Expires",
        String(SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS)
      )

      const signedRequest = await client.sign(
        new Request(url, {
          method: "PUT",
          headers: { "Content-Type": input.contentType },
        }),
        { aws: { signQuery: true, allHeaders: true } }
      )

      return signedRequest.url.toString()
    },
    async inspectObject(objectKey) {
      const url = getObjectUrl(objectKey)
      const metadata = await client.fetch(new Request(url, { method: "HEAD" }))
      await assertSuccessfulResponse(metadata)
      const body = await client.fetch(
        new Request(url, { headers: { Range: "bytes=0-11" } })
      )
      await assertSuccessfulResponse(body)

      return {
        contentLength:
          Number(metadata.headers.get("Content-Length")) || undefined,
        contentType: metadata.headers.get("Content-Type") ?? undefined,
        firstBytes: new Uint8Array(await body.arrayBuffer()),
      }
    },
    async deleteObject(objectKey) {
      const response = await client.fetch(
        new Request(getObjectUrl(objectKey), { method: "DELETE" })
      )
      await assertSuccessfulResponse(response)
    },
    async moveObject(sourceObjectKey, destinationObjectKey) {
      await moveSurfaceImageObjectWithRollback({
        async copyObject() {
          const response = await client.fetch(
            new Request(getObjectUrl(destinationObjectKey), {
              method: "PUT",
              headers: {
                "X-Amz-Copy-Source": `/${configuration.bucket}/${sourceObjectKey}`,
              },
            })
          )
          await assertSuccessfulResponse(response)
        },
        async deleteSource() {
          const response = await client.fetch(
            new Request(getObjectUrl(sourceObjectKey), { method: "DELETE" })
          )
          await assertSuccessfulResponse(response)
        },
        async deleteDestination() {
          const response = await client.fetch(
            new Request(getObjectUrl(destinationObjectKey), {
              method: "DELETE",
            })
          )
          await assertSuccessfulResponse(response)
        },
      })
    },
  }
}

export async function moveSurfaceImageObjectWithRollback({
  copyObject,
  deleteSource,
  deleteDestination,
}: {
  copyObject: () => Promise<void>
  deleteSource: () => Promise<void>
  deleteDestination: () => Promise<void>
}) {
  await copyObject()
  try {
    await deleteSource()
  } catch (error) {
    try {
      await deleteDestination()
    } catch {
      // Preserve the source-deletion failure that made the move incomplete.
    }
    throw error
  }
}

function getObjectKeyFromPublishedImageUrl(
  imageUrl: string,
  publicBaseUrl: string
) {
  const parsedImageUrl = new URL(imageUrl)
  const parsedPublicBaseUrl = new URL(`${publicBaseUrl}/`)

  if (parsedImageUrl.origin !== parsedPublicBaseUrl.origin) {
    throw new Error("Surface Image URL is not managed by this R2 storage.")
  }

  const publicPathPrefix = parsedPublicBaseUrl.pathname.replace(/^\//, "")
  const imagePath = decodeURIComponent(parsedImageUrl.pathname).replace(
    /^\//,
    ""
  )
  const objectKey = publicPathPrefix
    ? imagePath.startsWith(publicPathPrefix)
      ? imagePath.slice(publicPathPrefix.length)
      : ""
    : imagePath
  if (
    !objectKey.startsWith("surface-images/") ||
    objectKey.startsWith("surface-images/temporary/")
  ) {
    throw new Error("Surface Image URL is not managed by this R2 storage.")
  }

  return objectKey
}

export function createR2SurfaceImageStorage(
  configuration = getR2Configuration(),
  objectStorage = createS3ObjectStorage(configuration)
): SurfaceImageStorage {
  return {
    async authorizeUpload(input) {
      assertAcceptedUploadRequest(input)

      const objectKey = `surface-images/temporary/${randomUUID()}`
      const expiresAt =
        Date.now() + SURFACE_IMAGE_UPLOAD_EXPIRES_IN_SECONDS * 1000
      const reference = createUploadReference(
        {
          contentLength: input.contentLength,
          contentType: input.contentType,
          expiresAt,
          objectKey,
          surface: input.surface,
        },
        configuration.secretAccessKey
      )
      const uploadUrl = await objectStorage.createPresignedPutUrl({
        objectKey,
        contentLength: input.contentLength,
        contentType: input.contentType,
      })

      return { reference, uploadUrl }
    },

    async resolveUpload(reference, surface) {
      const payload = parseUploadReference(
        reference,
        configuration.secretAccessKey
      )
      if (payload.surface !== surface) {
        throw new Error(
          "Surface Image upload reference is not authorized for this Surface."
        )
      }
      const object = await objectStorage.inspectObject(payload.objectKey)

      if (
        object.contentLength !== payload.contentLength ||
        object.contentType !== payload.contentType
      ) {
        throw new Error(
          "Uploaded Surface Image does not match its authorization."
        )
      }

      assertAcceptedUploadRequest({
        surface,
        contentLength: object.contentLength,
        contentType: object.contentType,
      })

      if (!hasExpectedImageSignature(payload.contentType, object.firstBytes)) {
        throw new Error("Uploaded Surface Image content is invalid.")
      }

      const publishedObjectKey = payload.objectKey.replace(
        "surface-images/temporary/",
        "surface-images/published/"
      )
      if (publishedObjectKey === payload.objectKey) {
        throw new Error("Surface Image upload reference is invalid.")
      }
      await objectStorage.moveObject(payload.objectKey, publishedObjectKey)

      return {
        imageUrl: new URL(
          publishedObjectKey,
          `${configuration.publicBaseUrl}/`
        ).toString(),
      }
    },

    async deleteUpload(reference, surface) {
      const payload = parseUploadReference(
        reference,
        configuration.secretAccessKey
      )
      if (payload.surface !== surface) {
        throw new Error(
          "Surface Image upload reference is not authorized for this Surface."
        )
      }

      await objectStorage.deleteObject(payload.objectKey)
    },

    async deletePublishedImage(imageUrl) {
      await objectStorage.deleteObject(
        getObjectKeyFromPublishedImageUrl(imageUrl, configuration.publicBaseUrl)
      )
    },
  }
}
