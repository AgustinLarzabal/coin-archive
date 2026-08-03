import type { Theme } from "@coin-archive/api"

export type ThemeDraft = {
  code: string
  name: string
}

export const EMPTY_THEME_DRAFT: ThemeDraft = {
  code: "",
  name: "",
}

export function createThemeDraft(
  theme: Pick<Theme, "code" | "name">
): ThemeDraft {
  return {
    code: theme.code,
    name: theme.name,
  }
}

export function normalizeThemeDraft(draft: ThemeDraft): ThemeDraft {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
  }
}

export function isThemeDraftComplete(draft: ThemeDraft) {
  const normalizedDraft = normalizeThemeDraft(draft)

  return normalizedDraft.code.length > 0 && normalizedDraft.name.length > 0
}

export function hasThemeEditChanges(
  theme: Pick<Theme, "code" | "name">,
  draft: ThemeDraft
) {
  const normalizedCurrent = normalizeThemeDraft(createThemeDraft(theme))
  const normalizedDraft = normalizeThemeDraft(draft)
  return (
    normalizedDraft.code !== normalizedCurrent.code ||
    normalizedDraft.name !== normalizedCurrent.name
  )
}
