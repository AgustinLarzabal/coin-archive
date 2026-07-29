import { useEffect, useRef, useState } from "react"
import { FileUpload } from "@coin-archive/ui/components/motion/file-upload"
import type { FileUploadItem } from "@coin-archive/ui/components/motion/file-upload"

type Surface = "obverse" | "reverse" | "edge"

type UploadAuthorization = {
  reference: string
  uploadUrl: string
}

const SURFACE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED_SURFACE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export function getSurfaceImageFileError(file: Pick<File, "size" | "type">) {
  if (!ACCEPTED_SURFACE_IMAGE_TYPES.has(file.type)) {
    return "Surface Images must be JPEG, PNG, or WebP files."
  }

  if (file.size <= 0) {
    return "Surface Image files must not be empty."
  }

  if (file.size > SURFACE_IMAGE_MAX_BYTES) {
    return "Surface Images must be 10 MB or smaller."
  }

  return null
}

export function SurfaceImageUpload({
  surface,
  onPendingChange,
  onReferenceChange,
  authorizeUpload,
  removeUpload,
}: {
  surface: Surface
  onPendingChange: (isPending: boolean) => void
  onReferenceChange: (reference: string) => void
  removeUpload: (input: {
    reference: string
    surface: Surface
  }) => Promise<void | { formError?: string }>
  authorizeUpload: (input: {
    surface: Surface
    contentType: string
    contentLength: number
  }) => Promise<UploadAuthorization | { formError?: string }>
}) {
  const [items, setItems] = useState<FileUploadItem[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
    string | null
  >(null)
  const activeUploadIdRef = useRef<string | null>(null)
  const uploadReferencesRef = useRef(new Map<string, string>())
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null)
  const [removalError, setRemovalError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedFile === null) {
      setSelectedImagePreviewUrl(null)
      return
    }

    const previewUrl = URL.createObjectURL(selectedFile)
    setSelectedImagePreviewUrl(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [selectedFile])

  function replaceItem(id: string, update: Partial<FileUploadItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item))
    )
  }

  async function upload(item: FileUploadItem, file: File) {
    const fileError = getSurfaceImageFileError(file)

    if (fileError !== null) {
      replaceItem(item.id, { status: "error", error: fileError })
      return
    }

    activeUploadIdRef.current = item.id
    setSelectedFile(file)
    onPendingChange(true)
    replaceItem(item.id, { status: "uploading", progress: 0, error: undefined })
    onReferenceChange("")

    try {
      const authorization = await authorizeUpload({
        surface,
        contentType: file.type,
        contentLength: file.size,
      })

      if (!("reference" in authorization)) {
        throw new Error(
          authorization.formError ?? "Unable to authorize upload."
        )
      }

      uploadReferencesRef.current.set(item.id, authorization.reference)
      await putFile(authorization.uploadUrl, file, (progress) =>
        replaceItem(item.id, { progress })
      )
      if (activeUploadIdRef.current === item.id) {
        replaceItem(item.id, { status: "success", progress: 100 })
        onReferenceChange(authorization.reference)
      } else {
        void deleteUploadReference(authorization.reference)
      }
    } catch (error) {
      if (activeUploadIdRef.current === item.id) {
        replaceItem(item.id, {
          status: "error",
          error:
            error instanceof Error ? error.message : "Unable to upload file.",
        })
      }
    } finally {
      if (activeUploadIdRef.current === item.id) onPendingChange(false)
    }
  }

  async function deleteUploadReference(reference: string) {
    setPendingRemoval(reference)
    setRemovalError(null)
    const result = await removeUpload({ reference, surface })

    if (result) {
      setRemovalError(result.formError ?? "Unable to remove upload.")
      return
    }

    setPendingRemoval((current) => (current === reference ? null : current))
    uploadReferencesRef.current.forEach((itemReference, itemId) => {
      if (itemReference === reference)
        uploadReferencesRef.current.delete(itemId)
    })
  }

  return (
    <>
      <FileUpload
        accept="image/jpeg,image/png,image/webp"
        description="JPEG, PNG, or WebP up to 10 MB."
        maxFiles={1}
        multiple={false}
        onFilesAdded={(addedItems, files) => {
          const item = addedItems[0]
          const file = files[0]
          void upload(item, file)
        }}
        onRemove={(item) => {
          if (activeUploadIdRef.current === item.id) {
            activeUploadIdRef.current = null
            setSelectedFile(null)
            onPendingChange(false)
          }
          const reference = uploadReferencesRef.current.get(item.id)
          onReferenceChange("")
          if (reference) {
            void deleteUploadReference(reference)
          }
        }}
        onRetry={(item) => {
          if (item.file) void upload(item, item.file)
        }}
        title="Drop a Surface Image here"
        value={items}
        onValueChange={setItems}
      />
      {selectedImagePreviewUrl ? (
        <img
          src={selectedImagePreviewUrl}
          alt={`Selected ${surface} Surface Image`}
          className="max-h-64 rounded border object-contain"
        />
      ) : null}
      {removalError ? (
        <div className="flex items-center gap-3 text-sm text-destructive">
          <p>{removalError}</p>
          {pendingRemoval ? (
            <button
              type="button"
              onClick={() => void deleteUploadReference(pendingRemoval)}
              className="rounded border px-3 py-2"
            >
              Retry removal
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function putFile(
  url: string,
  file: File,
  onProgress: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open("PUT", url)
    request.setRequestHeader("Content-Type", file.type)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress((event.loaded / event.total) * 100)
      }
    }
    request.onerror = () => reject(new Error("Upload failed. Please retry."))
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve()
      } else {
        reject(new Error("Upload failed. Please retry."))
      }
    }
    request.send(file)
  })
}
