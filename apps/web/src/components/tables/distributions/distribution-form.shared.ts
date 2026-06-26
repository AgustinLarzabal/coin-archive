export type DistributionDraft = {
  code: string
  name: string
}

export const EMPTY_DISTRIBUTION_DRAFT: DistributionDraft = {
  code: "",
  name: "",
}

export function isDistributionDraftComplete(draft: DistributionDraft) {
  return draft.code.trim().length > 0 && draft.name.trim().length > 0
}
