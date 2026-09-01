import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateRulerGroup,
  submitDeleteRulerGroup,
  submitUpdateRulerGroup,
} from "./actions.server"
import type { RulerGroupDraft } from "./form-workflow/ruler-group-form.shared"

export const createRulerGroupMutation = createServerFn({ method: "POST" })
  .inputValidator((data: RulerGroupDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateRulerGroup(data))

export const replaceRulerGroupMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: RulerGroupDraft & { id: string; etag: string }) => data
  )
  .handler(({ data }) => submitUpdateRulerGroup(data))

export const deleteRulerGroupMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteRulerGroup(data))
