import { asc } from "drizzle-orm"

import { db } from "../client"
import { theme } from "../schema/theme"
import type { Theme } from "../schema/theme"

const getThemesSelection = {
  id: theme.id,
  code: theme.code,
  name: theme.name,
}

export type ThemeOption = Pick<Theme, "id" | "code" | "name">

export async function getThemes(): Promise<ThemeOption[]> {
  return db
    .select(getThemesSelection)
    .from(theme)
    .orderBy(asc(theme.name), asc(theme.code))
}
