import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateRim,
  submitDeleteRim,
  submitUpdateRim,
} from "./actions.server"
import type { RimDraft } from "./form-workflow/rim-form.shared"

export const createRimMutation = createServerFn({ method: "POST" })
  .inputValidator((data: RimDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateRim(data))

export const replaceRimMutation = createServerFn({ method: "POST" })
  .inputValidator((data: RimDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateRim(data))

export const deleteRimMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteRim(data))
