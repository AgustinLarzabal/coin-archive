import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createTheme } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getThemes } from "./get-themes"

describe("getThemes integration", () => {
  useTestDatabaseIsolation(db)

  it("returns theme options sorted by name and code", async () => {
    const building = await createTheme({
      code: "building",
      name: "Building",
    })
    const animal = await createTheme({
      code: "animal",
      name: "Theme",
    })
    const portrait = await createTheme({
      code: "portrait",
      name: "Theme",
    })

    await expect(getThemes()).resolves.toStrictEqual([
      {
        id: building.id,
        code: "building",
        name: "Building",
        createdAt: building.createdAt,
        updatedAt: building.updatedAt,
      },
      {
        id: animal.id,
        code: "animal",
        name: "Theme",
        createdAt: animal.createdAt,
        updatedAt: animal.updatedAt,
      },
      {
        id: portrait.id,
        code: "portrait",
        name: "Theme",
        createdAt: portrait.createdAt,
        updatedAt: portrait.updatedAt,
      },
    ])
  })
})
