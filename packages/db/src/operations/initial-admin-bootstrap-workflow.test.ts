import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const initialAdminBootstrapWorkflow = readFileSync(
  fileURLToPath(
    new URL(
      "../../../../.github/workflows/bootstrap-initial-admin.yml",
      import.meta.url
    )
  ),
  "utf8"
)

describe("initial Admin bootstrap workflow", () => {
  it("runs only when manually dispatched against a selected protected environment", () => {
    expect(initialAdminBootstrapWorkflow).toMatch(
      /on:\n {2}workflow_dispatch:\n {4}inputs:\n {6}environment:/
    )
    expect(initialAdminBootstrapWorkflow).toContain("type: choice")
    expect(initialAdminBootstrapWorkflow).toContain("- staging")
    expect(initialAdminBootstrapWorkflow).toContain("- production")
    expect(initialAdminBootstrapWorkflow).toContain(
      "environment: ${{ inputs.environment }}"
    )
    expect(initialAdminBootstrapWorkflow).toContain(
      "INITIAL_ADMIN_EMAIL: ${{ secrets.INITIAL_ADMIN_EMAIL }}"
    )
    expect(initialAdminBootstrapWorkflow).toContain(
      "pnpm --filter @workspace/db run bootstrap:initial-admin"
    )
  })
})
