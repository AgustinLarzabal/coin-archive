import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateShape,
  submitDeleteShape,
  submitUpdateShape,
} from "./actions.server"
import type { ShapeDraft } from "./form-workflow/shape-form.shared"

export const createShapeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: ShapeDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateShape(data))

export const replaceShapeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: ShapeDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateShape(data))

export const deleteShapeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteShape(data))
