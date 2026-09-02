import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateMint,
  submitDeleteMint,
  submitUpdateMint,
} from "./actions.server"
import type { MintDraft } from "./form-workflow/mint-form.shared"

export const createMintMutation = createServerFn({ method: "POST" })
  .inputValidator((data: MintDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateMint(data))

export const replaceMintMutation = createServerFn({ method: "POST" })
  .inputValidator((data: MintDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateMint(data))

export const deleteMintMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteMint(data))
