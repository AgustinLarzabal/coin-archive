import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateEdge,
  submitDeleteEdge,
  submitUpdateEdge,
} from "./actions.server"
import type { EdgeDraft } from "./form-workflow/edge-form.shared"

export const createEdgeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: EdgeDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateEdge(data))

export const replaceEdgeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: EdgeDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateEdge(data))

export const deleteEdgeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteEdge(data))
