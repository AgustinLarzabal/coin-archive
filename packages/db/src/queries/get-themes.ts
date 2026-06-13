import { asc } from "drizzle-orm"

import { db } from "../client"
import { theme } from "../schema/theme"
import type { Theme } from "../schema/theme"

const getThemesSelection = {
  id: theme.id,
  code: theme.code,
  name: theme.name,
  createdAt: theme.createdAt,
  updatedAt: theme.updatedAt,
}

export type ThemeOption = Pick<
  Theme,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getThemes(): Promise<ThemeOption[]> {
  return db
    .select(getThemesSelection)
    .from(theme)
    .orderBy(asc(theme.name), asc(theme.code))
}
