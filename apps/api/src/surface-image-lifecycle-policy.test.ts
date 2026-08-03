import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("R2 Surface Image lifecycle policy", () => {
  it("expires only abandoned temporary objects after one day", async () => {
    const policy = JSON.parse(
      await readFile(
        new URL(
          "../../../infrastructure/r2-surface-image-lifecycle.json",
          import.meta.url
        ),
        "utf8"
      )
    ) as {
      rules: Array<{
        id: string
        enabled: boolean
        conditions: { prefix: string }
        deleteObjectsTransition: {
          condition: { type: string; maxAge: number }
        }
      }>
    }

    expect(policy.rules).toStrictEqual([
      {
        id: "expire-abandoned-temporary-surface-images",
        enabled: true,
        conditions: { prefix: "surface-images/temporary/" },
        deleteObjectsTransition: {
          condition: { type: "Age", maxAge: 24 * 60 * 60 },
        },
      },
    ])
    expect(
      "surface-images/published/opaque-id".startsWith(
        policy.rules[0].conditions.prefix
      )
    ).toBe(false)
  })
})
