import type { IssuerMaintenanceRecord } from "@workspace/db"

export type IssuerDraft = {
  code: string
  isoCode: string
  name: string
  parentIssuerLabel: string
}

export type ParentIssuerOption = {
  id: string
  label: string
}

export const EMPTY_ISSUER_DRAFT: IssuerDraft = {
  code: "",
  isoCode: "",
  name: "",
  parentIssuerLabel: "",
}

export function createIssuerDraft(
  issuer: IssuerMaintenanceRecord,
  issuers: IssuerMaintenanceRecord[]
): IssuerDraft {
  return {
    code: issuer.code,
    isoCode: issuer.isoCode,
    name: issuer.name,
    parentIssuerLabel: issuer.parent
      ? (getParentIssuerOptions(issuers, issuer.id).find(
          (option) => option.id === issuer.parent?.id
        )?.label ?? "")
      : "",
  }
}

export function normalizeIssuerDraft(draft: IssuerDraft): IssuerDraft {
  return {
    code: draft.code.trim(),
    isoCode: draft.isoCode.trim().toUpperCase(),
    name: draft.name.trim(),
    parentIssuerLabel: draft.parentIssuerLabel.trim(),
  }
}

export function isIssuerDraftComplete(draft: IssuerDraft) {
  const normalizedDraft = normalizeIssuerDraft(draft)

  return (
    normalizedDraft.code.length > 0 &&
    normalizedDraft.isoCode.length > 0 &&
    normalizedDraft.name.length > 0
  )
}

export function getParentIssuerOptions(
  issuers: IssuerMaintenanceRecord[],
  currentIssuerId?: string
): ParentIssuerOption[] {
  const excludedIssuerIds = currentIssuerId
    ? new Set([
        currentIssuerId,
        ...getDescendantIssuerIds(issuers, currentIssuerId),
      ])
    : new Set<string>()

  return issuers
    .filter((issuer) => !excludedIssuerIds.has(issuer.id))
    .map((issuer) => ({
      id: issuer.id,
      label: buildIssuerContextLabel(issuer, issuers),
    }))
}

export function resolveParentIssuerId(
  parentIssuerLabel: string,
  options: ParentIssuerOption[]
): string | null | typeof INVALID_PARENT_ISSUER_SELECTION {
  const normalizedLabel = parentIssuerLabel.trim()

  if (normalizedLabel === "") {
    return null
  }

  const matchedOption = options.find(
    (option) => option.label === normalizedLabel
  )

  return matchedOption?.id ?? INVALID_PARENT_ISSUER_SELECTION
}

export const INVALID_PARENT_ISSUER_SELECTION = Symbol(
  "INVALID_PARENT_ISSUER_SELECTION"
)

function buildIssuerContextLabel(
  issuer: IssuerMaintenanceRecord,
  issuers: IssuerMaintenanceRecord[]
): string {
  const segments = [`${issuer.name} (${issuer.code})`]
  let currentParentId = issuer.parent?.id ?? null

  while (currentParentId) {
    const parentIssuer = issuers.find(
      (candidate) => candidate.id === currentParentId
    )

    if (!parentIssuer) {
      break
    }

    segments.push(`${parentIssuer.name} (${parentIssuer.code})`)
    currentParentId = parentIssuer.parent?.id ?? null
  }

  return segments.join(" > ")
}

function getDescendantIssuerIds(
  issuers: IssuerMaintenanceRecord[],
  issuerId: string
): string[] {
  const descendantIssuerIds: string[] = []
  const parentToChildren = new Map<string, string[]>()

  for (const issuer of issuers) {
    const parentIssuerId = issuer.parent?.id

    if (!parentIssuerId) {
      continue
    }

    const childIssuerIds = parentToChildren.get(parentIssuerId) ?? []
    childIssuerIds.push(issuer.id)
    parentToChildren.set(parentIssuerId, childIssuerIds)
  }

  const queue = [...(parentToChildren.get(issuerId) ?? [])]

  while (queue.length > 0) {
    const childIssuerId = queue.shift()

    if (!childIssuerId) {
      continue
    }

    descendantIssuerIds.push(childIssuerId)
    queue.push(...(parentToChildren.get(childIssuerId) ?? []))
  }

  return descendantIssuerIds
}
