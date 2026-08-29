import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateOrientation,
  submitDeleteOrientation,
  submitUpdateOrientation,
} from "./actions.server"
import type { OrientationDraft } from "./form-workflow/orientation-form.shared"

export const createOrientationMutation = createServerFn({ method: "POST" })
  .inputValidator((data: OrientationDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateOrientation(data))

export const replaceOrientationMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: OrientationDraft & { id: string; etag: string }) => data
  )
  .handler(({ data }) => submitUpdateOrientation(data))

export const deleteOrientationMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteOrientation(data))
