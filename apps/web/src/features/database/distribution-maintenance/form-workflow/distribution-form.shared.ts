import type { Distribution } from "@coin-archive/api"

export type DistributionDraft = {
  code: string
  name: string
}

export const EMPTY_DISTRIBUTION_DRAFT: DistributionDraft = {
  code: "",
  name: "",
}

export function createDistributionDraft(
  distribution: Pick<Distribution, "code" | "name">
): DistributionDraft {
  return {
    code: distribution.code,
    name: distribution.name,
  }
}

export function normalizeDistributionDraft(
  draft: DistributionDraft
): DistributionDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isDistributionDraftComplete(draft: DistributionDraft) {
  const normalizedDraft = normalizeDistributionDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}
