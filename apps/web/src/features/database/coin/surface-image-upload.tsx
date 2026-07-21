import { useRef, useState } from "react"
import { FileUpload } from "@workspace/ui/components/motion/file-upload"
import type { FileUploadItem } from "@workspace/ui/components/motion/file-upload"

type Surface = "obverse" | "reverse" | "edge"

type UploadAuthorization = {
  reference: string
  uploadUrl: string
}

export function SurfaceImageUpload({
  surface,
  onPendingChange,
  onReferenceChange,
  authorizeUpload,
}: {
  surface: Surface
  onPendingChange: (isPending: boolean) => void
  onReferenceChange: (reference: string) => void
  authorizeUpload: (input: {
    surface: Surface
    contentType: string
    contentLength: number
  }) => Promise<UploadAuthorization | { formError?: string }>
}) {
  const [items, setItems] = useState<FileUploadItem[]>([])
  const activeUploadIdRef = useRef<string | null>(null)

  function replaceItem(id: string, update: Partial<FileUploadItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item))
    )
  }

  async function upload(item: FileUploadItem, file: File) {
    activeUploadIdRef.current = item.id
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
        throw new Error(authorization.formError ?? "Unable to authorize upload.")
      }

      await putFile(authorization.uploadUrl, file, (progress) =>
        replaceItem(item.id, { progress })
      )
      if (activeUploadIdRef.current === item.id) {
        replaceItem(item.id, { status: "success", progress: 100 })
        onReferenceChange(authorization.reference)
      }
    } catch (error) {
      if (activeUploadIdRef.current === item.id) {
        replaceItem(item.id, {
          status: "error",
          error: error instanceof Error ? error.message : "Unable to upload file.",
        })
      }
    } finally {
      if (activeUploadIdRef.current === item.id) onPendingChange(false)
    }
  }

  return (
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
          onPendingChange(false)
        }
        onReferenceChange("")
      }}
      onRetry={(item) => {
        if (item.file) void upload(item, item.file)
      }}
      title="Drop a Surface Image here"
      value={items}
      onValueChange={setItems}
    />
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
