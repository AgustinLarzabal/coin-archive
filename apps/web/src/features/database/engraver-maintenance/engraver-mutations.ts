import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateEngraver,
  submitDeleteEngraver,
  submitUpdateEngraver,
} from "./actions.server"
import type { EngraverDraft } from "./form-workflow/engraver-form.shared"

export const createEngraverMutation = createServerFn({ method: "POST" })
  .inputValidator((data: EngraverDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateEngraver(data))

export const replaceEngraverMutation = createServerFn({ method: "POST" })
  .inputValidator((data: EngraverDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateEngraver(data))

export const deleteEngraverMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteEngraver(data))
