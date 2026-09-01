import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateComposition,
  submitDeleteComposition,
  submitUpdateComposition,
} from "./actions.server"

type CompositionDraft = {
  code: string
  name: string
}

export const createCompositionMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CompositionDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateComposition(data))

export const replaceCompositionMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: CompositionDraft & { id: string; etag: string }) => data
  )
  .handler(({ data }) => submitUpdateComposition(data))

export const deleteCompositionMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteComposition(data))
