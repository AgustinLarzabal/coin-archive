import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateCatalogue,
  submitDeleteCatalogue,
  submitUpdateCatalogue,
} from "./actions.server"
import type { CatalogueDraft } from "./form-workflow/catalogue-form.shared"

export const createCatalogueMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CatalogueDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateCatalogue(data))

export const replaceCatalogueMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CatalogueDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateCatalogue(data))

export const deleteCatalogueMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteCatalogue(data))
