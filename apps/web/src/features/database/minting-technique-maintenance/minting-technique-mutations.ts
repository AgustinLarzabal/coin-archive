import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateMintingTechnique,
  submitDeleteMintingTechnique,
  submitUpdateMintingTechnique,
} from "./actions.server"
import type { MintingTechniqueDraft } from "./form-workflow/minting-technique-form.shared"

export const createMintingTechniqueMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: MintingTechniqueDraft & { idempotencyKey: string }) => data
  )
  .handler(({ data }) => submitCreateMintingTechnique(data))

export const replaceMintingTechniqueMutation = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: MintingTechniqueDraft & { id: string; etag: string }) => data
  )
  .handler(({ data }) => submitUpdateMintingTechnique(data))

export const deleteMintingTechniqueMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteMintingTechnique(data))
