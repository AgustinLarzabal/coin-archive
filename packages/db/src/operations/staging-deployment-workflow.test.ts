import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const stagingDeploymentWorkflow = readFileSync(
  fileURLToPath(
    new URL("../../../../.github/workflows/deploy-staging.yml", import.meta.url)
  ),
  "utf8"
)

describe("staging deployment workflow", () => {
  it("verifies main, migrates staging, then releases without resetting or seeding", () => {
    expect(stagingDeploymentWorkflow).toMatch(
      /on:\n {2}push:\n {4}branches: \[main\]/
    )
    expect(stagingDeploymentWorkflow).toMatch(/environment: staging/)
    expect(stagingDeploymentWorkflow).toMatch(/needs: verify/)
    expect(stagingDeploymentWorkflow).toContain("pnpm lint")
    expect(stagingDeploymentWorkflow).toContain("pnpm typecheck")
    expect(stagingDeploymentWorkflow).toContain("pnpm test")
    expect(stagingDeploymentWorkflow).toContain("pnpm db:start")
    expect(stagingDeploymentWorkflow).toContain("pnpm db:test")
    expect(stagingDeploymentWorkflow).toContain("pnpm db:migrate")
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter web run deploy:staging"
    )
    expect(stagingDeploymentWorkflow).not.toMatch(/\b(?:reset|seed)\b/i)

    expect(stagingDeploymentWorkflow.indexOf("pnpm db:migrate")).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("pnpm --filter web run deploy:staging")
    )
    expect(stagingDeploymentWorkflow.indexOf("pnpm db:start")).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("pnpm db:test")
    )
  })
})
