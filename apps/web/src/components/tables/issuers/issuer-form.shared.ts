export type IssuerDraft = {
  code: string
  name: string
  isoCode: string
  parentIssuerId: string
}

export const EMPTY_ISSUER_DRAFT: IssuerDraft = {
  code: "",
  name: "",
  isoCode: "",
  parentIssuerId: "",
}

export function normalizeIssuerDraft(draft: IssuerDraft): IssuerDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    isoCode: draft.isoCode.trim(),
    parentIssuerId: draft.parentIssuerId.trim(),
  }
}

export function isIssuerDraftComplete(draft: IssuerDraft) {
  const normalizedDraft = normalizeIssuerDraft(draft)

  return (
    normalizedDraft.code.length > 0 &&
    normalizedDraft.name.length > 0 &&
    normalizedDraft.isoCode.length > 0
  )
}
