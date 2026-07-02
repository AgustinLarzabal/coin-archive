import type { RulerGroupOption, RulerOption } from "@workspace/db"
import type { z } from "zod"

import type { RulerMutationResult } from "@/lib/ruler-maintenance"
import {
  createRulerInputSchema,
  getRulerFieldErrors,
  updateRulerInputSchema,
} from "@/lib/ruler-maintenance"

export type RulerDraft = {
  code: string
  name: string
  rulerGroupLabel: string
}

export type RulerGroupSelectionOption = {
  id: string
  label: string
}

export const EMPTY_RULER_DRAFT: RulerDraft = {
  code: "",
  name: "",
  rulerGroupLabel: "",
}

export const INVALID_RULER_GROUP_ERROR =
  "Select a Ruler Group from the list."

type ValidRulerSubmission<TData> = {
  status: "valid"
  data: TData
}

type InvalidRulerSubmission = {
  status: "invalid"
  result: RulerMutationResult
}

type RulerSubmissionResult<TData> =
  | ValidRulerSubmission<TData>
  | InvalidRulerSubmission

type CreateRulerSubmissionData = z.output<typeof createRulerInputSchema>
type UpdateRulerSubmissionData = z.output<typeof updateRulerInputSchema>

export function formatRulerGroupOptionLabel(
  rulerGroup: Pick<RulerGroupOption, "code" | "name">
) {
  return `${rulerGroup.name} (${rulerGroup.code})`
}

export function createRulerDraft(ruler: RulerOption): RulerDraft {
  return {
    code: ruler.code,
    name: ruler.name,
    rulerGroupLabel: ruler.group ? formatRulerGroupOptionLabel(ruler.group) : "",
  }
}

export function normalizeRulerDraft(draft: RulerDraft): RulerDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    rulerGroupLabel: draft.rulerGroupLabel.trim(),
  }
}

export function isRulerDraftComplete(draft: RulerDraft) {
  const normalizedDraft = normalizeRulerDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}

export function getRulerGroupSelectionOptions(
  rulerGroups: RulerGroupOption[]
): RulerGroupSelectionOption[] {
  return rulerGroups.map((rulerGroup) => ({
    id: rulerGroup.id,
    label: formatRulerGroupOptionLabel(rulerGroup),
  }))
}

export const INVALID_RULER_GROUP_SELECTION = Symbol(
  "INVALID_RULER_GROUP_SELECTION"
)

export function resolveRulerGroupId(
  rulerGroupLabel: string,
  options: RulerGroupSelectionOption[]
): string | null | typeof INVALID_RULER_GROUP_SELECTION {
  const normalizedLabel = rulerGroupLabel.trim()

  if (normalizedLabel === "") {
    return null
  }

  const matchedOption = options.find((option) => option.label === normalizedLabel)

  return matchedOption?.id ?? INVALID_RULER_GROUP_SELECTION
}

export function getCreateRulerSubmission(
  draft: RulerDraft,
  rulerGroups: RulerGroupOption[]
): RulerSubmissionResult<CreateRulerSubmissionData> {
  return resolveRulerSubmission(
    draft,
    getRulerGroupSelectionOptions(rulerGroups),
    createRulerInputSchema,
    buildRulerSubmissionInput
  )
}

export function getUpdateRulerSubmission(
  rulerId: string,
  draft: RulerDraft,
  rulerGroups: RulerGroupOption[]
): RulerSubmissionResult<UpdateRulerSubmissionData> {
  return resolveRulerSubmission(
    draft,
    getRulerGroupSelectionOptions(rulerGroups),
    updateRulerInputSchema,
    (normalizedDraft, rulerGroupId) => ({
      id: rulerId,
      ...buildRulerSubmissionInput(normalizedDraft, rulerGroupId),
    })
  )
}

function resolveRulerSubmission<TSchema extends z.ZodType>(
  draft: RulerDraft,
  options: RulerGroupSelectionOption[],
  schema: TSchema,
  buildInput: (
    draft: RulerDraft,
    rulerGroupId: string | null
  ) => z.input<TSchema>
): RulerSubmissionResult<z.output<TSchema>> {
  const normalizedDraft = normalizeRulerDraft(draft)
  const rulerGroupId = resolveRulerGroupId(
    normalizedDraft.rulerGroupLabel,
    options
  )

  if (rulerGroupId === INVALID_RULER_GROUP_SELECTION) {
    return createInvalidRulerGroupSubmission()
  }

  const parsedInput = schema.safeParse(
    buildInput(normalizedDraft, rulerGroupId)
  )

  if (!parsedInput.success) {
    return createInvalidRulerSubmission(parsedInput.error.issues)
  }

  return {
    status: "valid",
    data: parsedInput.data,
  }
}

function buildRulerSubmissionInput(
  draft: RulerDraft,
  rulerGroupId: string | null
) {
  return {
    code: draft.code,
    name: draft.name,
    rulerGroupId,
  }
}

function createInvalidRulerGroupSubmission(): InvalidRulerSubmission {
  return {
    status: "invalid",
    result: {
      status: "error",
      fieldErrors: {
        rulerGroupId: INVALID_RULER_GROUP_ERROR,
      },
    },
  }
}

function createInvalidRulerSubmission(
  issues: z.ZodIssue[]
): InvalidRulerSubmission {
  return {
    status: "invalid",
    result: {
      status: "error",
      fieldErrors: getRulerFieldErrors(issues),
    },
  }
}
