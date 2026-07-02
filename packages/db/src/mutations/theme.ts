import { eq } from "drizzle-orm"

import { db } from "../client"
import { theme } from "../schema/theme"
import type { Theme } from "../schema/theme"

type ThemeFields = {
  code: string
  name: string
}

type UpdateThemeInput = ThemeFields & {
  id: string
}

type DeleteThemeInput = {
  id: string
}

function normalizeThemeFields({ code, name }: ThemeFields) {
  return {
    code: code.trim(),
    name: name.trim(),
  }
}

export async function createTheme(fields: ThemeFields): Promise<Theme> {
  const [createdTheme] = await db
    .insert(theme)
    .values(normalizeThemeFields(fields))
    .returning()

  return createdTheme
}

export async function updateTheme({
  id,
  ...fields
}: UpdateThemeInput): Promise<Theme | null> {
  const updatedTheme = (
    await db
      .update(theme)
      .set({
        ...normalizeThemeFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(theme.id, id))
      .returning()
  ).at(0)

  return updatedTheme ?? null
}

export async function deleteTheme({
  id,
}: DeleteThemeInput): Promise<Theme | null> {
  const deletedTheme = (
    await db.delete(theme).where(eq(theme.id, id)).returning()
  ).at(0)

  return deletedTheme ?? null
}
