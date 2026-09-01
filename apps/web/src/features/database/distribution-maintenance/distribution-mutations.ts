import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateDistribution,
  submitDeleteDistribution,
  submitUpdateDistribution,
} from "./actions.server"
import type { DistributionDraft } from "./form-workflow/distribution-form.shared"

export const createDistributionMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: DistributionDraft & { idempotencyKey: string }) => data
  )
  .handler(({ data }) => submitCreateDistribution(data))

export const replaceDistributionMutation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: DistributionDraft & { id: string; etag: string }) => data
  )
  .handler(({ data }) => submitUpdateDistribution(data))

export const deleteDistributionMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteDistribution(data))
