import { asc } from "drizzle-orm"

import { db } from "../client"
import { theme } from "../schema/theme"
import type { Theme } from "../schema/theme"

const getThemesSelection = {
  createdAt: theme.createdAt,
  code: theme.code,
  id: theme.id,
  name: theme.name,
  updatedAt: theme.updatedAt,
}

export type ThemeOption = Pick<
  Theme,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getThemes(): Promise<ThemeOption[]> {
  return db
    .select(getThemesSelection)
    .from(theme)
    .orderBy(asc(theme.name), asc(theme.code))
}
