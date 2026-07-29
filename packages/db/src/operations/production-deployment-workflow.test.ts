import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const productionDeploymentWorkflow = readFileSync(
  fileURLToPath(
    new URL(
      "../../../../.github/workflows/deploy-production.yml",
      import.meta.url
    )
  ),
  "utf8"
)

describe("production deployment workflow", () => {
  it("promotes a successful staging deployment after approval without demo data", () => {
    expect(productionDeploymentWorkflow).toMatch(
      /on:\n {2}workflow_run:\n {4}workflows: \[Deploy staging\]\n {4}types: \[completed\]/
    )
    expect(productionDeploymentWorkflow).toMatch(/environment: production/)
    expect(productionDeploymentWorkflow).toContain(
      "if: ${{ github.event.workflow_run.conclusion == 'success' }}"
    )
    expect(productionDeploymentWorkflow).toContain(
      "ref: ${{ github.event.workflow_run.head_sha }}"
    )
    expect(productionDeploymentWorkflow).toContain("pnpm db:migrate")
    expect(productionDeploymentWorkflow).toContain(
      "VITE_SHOW_SIGN_IN_BUTTON: ${{ vars.VITE_SHOW_SIGN_IN_BUTTON }}"
    )
    expect(productionDeploymentWorkflow).toContain(
      "pnpm --filter web run deploy:production"
    )
    expect(productionDeploymentWorkflow).not.toMatch(/\b(?:reset|seed)\b/i)
    expect(productionDeploymentWorkflow).not.toMatch(/environment: staging/)

    expect(
      productionDeploymentWorkflow.indexOf("pnpm db:migrate")
    ).toBeLessThan(
      productionDeploymentWorkflow.indexOf(
        "pnpm --filter web run deploy:production"
      )
    )
  })
})
