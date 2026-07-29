import type { IssuerMaintenanceRecord } from "@coin-archive/db"
import type { z } from "zod"

import {
  createIssuerInputSchema,
  getIssuerFieldErrors,
  updateIssuerInputSchema,
} from "../validation"
import type { IssuerFieldErrors } from "../validation"
import type { IssuerMutationResult } from "../actions"

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

export const INVALID_PARENT_ISSUER_ERROR =
  "Select a Parent Issuer from the list."

export const INVALID_PARENT_ISSUER_SELECTION = Symbol(
  "INVALID_PARENT_ISSUER_SELECTION"
)

type ResolvedParentIssuerId =
  | string
  | null
  | typeof INVALID_PARENT_ISSUER_SELECTION

type ValidIssuerSubmission<TData> = {
  status: "valid"
  data: TData
}

type InvalidIssuerSubmission = {
  status: "invalid"
  result: IssuerMutationResult
}

type IssuerSubmissionResult<TData> =
  | ValidIssuerSubmission<TData>
  | InvalidIssuerSubmission

type CreateIssuerSubmissionData = z.output<typeof createIssuerInputSchema>
type UpdateIssuerSubmissionData = z.output<typeof updateIssuerInputSchema>

export function createIssuerDraft(
  issuer: IssuerMaintenanceRecord,
  issuers: IssuerMaintenanceRecord[]
): IssuerDraft {
  const issuersById = createIssuerRecordMap(issuers)

  return {
    code: issuer.code,
    isoCode: issuer.isoCode,
    name: issuer.name,
    parentIssuerLabel: issuer.parent
      ? buildIssuerContextLabel(issuer.parent.id, issuersById)
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
  const issuersById = createIssuerRecordMap(issuers)
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
      label: buildIssuerContextLabel(issuer.id, issuersById),
    }))
}

export function resolveParentIssuerId(
  parentIssuerLabel: string,
  options: ParentIssuerOption[]
): ResolvedParentIssuerId {
  const normalizedLabel = parentIssuerLabel.trim()

  if (normalizedLabel === "") {
    return null
  }

  const matchedOption = options.find(
    (option) => option.label === normalizedLabel
  )

  return matchedOption?.id ?? INVALID_PARENT_ISSUER_SELECTION
}
export function getCreateIssuerSubmission(
  draft: IssuerDraft,
  issuers: IssuerMaintenanceRecord[]
): IssuerSubmissionResult<CreateIssuerSubmissionData> {
  return resolveIssuerSubmission(
    draft,
    getParentIssuerOptions(issuers),
    createIssuerInputSchema,
    buildIssuerSubmissionInput
  )
}

export function getUpdateIssuerSubmission(
  issuerId: string,
  draft: IssuerDraft,
  issuers: IssuerMaintenanceRecord[]
): IssuerSubmissionResult<UpdateIssuerSubmissionData> {
  return resolveIssuerSubmission(
    draft,
    getParentIssuerOptions(issuers, issuerId),
    updateIssuerInputSchema,
    (normalizedDraft, parentIssuerId) => ({
      id: issuerId,
      ...buildIssuerSubmissionInput(normalizedDraft, parentIssuerId),
    })
  )
}

function resolveIssuerSubmission<TSchema extends z.ZodType>(
  draft: IssuerDraft,
  options: ParentIssuerOption[],
  schema: TSchema,
  buildInput: (
    draft: IssuerDraft,
    parentIssuerId: string | null
  ) => z.input<TSchema>
): IssuerSubmissionResult<z.output<TSchema>> {
  const normalizedDraft = normalizeIssuerDraft(draft)
  const parentIssuerId = resolveParentIssuerId(
    normalizedDraft.parentIssuerLabel,
    options
  )

  if (parentIssuerId === INVALID_PARENT_ISSUER_SELECTION) {
    return createInvalidParentIssuerSubmission()
  }

  const submissionInput = buildInput(normalizedDraft, parentIssuerId)
  const parsedInput = schema.safeParse(submissionInput)

  if (!parsedInput.success) {
    return createInvalidIssuerSubmission(parsedInput.error.issues)
  }

  return {
    status: "valid",
    data: parsedInput.data,
  }
}

function buildIssuerSubmissionInput(
  draft: IssuerDraft,
  parentIssuerId: string | null
) {
  return {
    code: draft.code,
    isoCode: draft.isoCode,
    name: draft.name,
    parentIssuerId,
  }
}

function createInvalidParentIssuerSubmission(): InvalidIssuerSubmission {
  return {
    status: "invalid",
    result: {
      status: "error",
      fieldErrors: {
        parentIssuerId: INVALID_PARENT_ISSUER_ERROR,
      },
    },
  }
}

function createInvalidIssuerSubmission(
  issues: z.ZodIssue[]
): InvalidIssuerSubmission {
  const fieldErrors: IssuerFieldErrors = getIssuerFieldErrors(issues)

  return {
    status: "invalid",
    result: {
      status: "error",
      fieldErrors,
    },
  }
}

function buildIssuerContextLabel(
  issuerId: string,
  issuersById: Map<string, IssuerMaintenanceRecord>
): string {
  const issuer = issuersById.get(issuerId)

  if (!issuer) {
    return ""
  }

  const segments = [formatIssuerLabel(issuer)]
  let currentParentId = issuer.parent?.id ?? null

  while (currentParentId) {
    const parentIssuer = issuersById.get(currentParentId)

    if (!parentIssuer) {
      break
    }

    segments.push(formatIssuerLabel(parentIssuer))
    currentParentId = parentIssuer.parent?.id ?? null
  }

  return segments.join(" > ")
}

function formatIssuerLabel(
  issuer: Pick<IssuerMaintenanceRecord, "name" | "code">
) {
  return `${issuer.name} (${issuer.code})`
}

function createIssuerRecordMap(
  issuers: IssuerMaintenanceRecord[]
): Map<string, IssuerMaintenanceRecord> {
  return new Map(issuers.map((issuer) => [issuer.id, issuer]))
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

  for (let index = 0; index < queue.length; index += 1) {
    const childIssuerId = queue[index]
    descendantIssuerIds.push(childIssuerId)
    queue.push(...(parentToChildren.get(childIssuerId) ?? []))
  }

  return descendantIssuerIds
}
