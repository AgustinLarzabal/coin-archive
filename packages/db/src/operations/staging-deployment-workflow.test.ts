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
    expect(stagingDeploymentWorkflow).toContain(
      "DATABASE_TEST_URL: postgresql://coin_archive:coin_archive@localhost:5432/coin_archive_test"
    )
    expect(stagingDeploymentWorkflow).toContain("pnpm lint")
    expect(stagingDeploymentWorkflow).toContain("pnpm typecheck")
    expect(stagingDeploymentWorkflow).toContain("pnpm test")
    expect(stagingDeploymentWorkflow).toContain("pnpm db:start")
    expect(stagingDeploymentWorkflow).toContain("pnpm db:test")
    expect(stagingDeploymentWorkflow).toContain("pnpm verify:staging")
    expect(stagingDeploymentWorkflow).not.toContain("pnpm test:e2e:staging")
    expect(stagingDeploymentWorkflow).toContain("pnpm db:migrate")
    expect(stagingDeploymentWorkflow).toContain(
      "VITE_SHOW_SIGN_IN_BUTTON: ${{ vars.VITE_SHOW_SIGN_IN_BUTTON }}"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter web run deploy:staging"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter api run deploy:staging"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "wrangler secret bulk --env staging"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter api run configure:r2-lifecycle:staging"
    )
    expect(stagingDeploymentWorkflow).not.toMatch(/\b(?:reset|seed)\b/i)

    expect(stagingDeploymentWorkflow.indexOf("pnpm db:migrate")).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("wrangler secret bulk --env staging")
    )
    expect(
      stagingDeploymentWorkflow.indexOf("wrangler secret bulk --env staging")
    ).toBeLessThan(
      stagingDeploymentWorkflow.indexOf(
        "pnpm --filter api run configure:r2-lifecycle:staging"
      )
    )
    expect(
      stagingDeploymentWorkflow.indexOf(
        "pnpm --filter api run configure:r2-lifecycle:staging"
      )
    ).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("pnpm --filter api run deploy:staging")
    )
    expect(
      stagingDeploymentWorkflow.indexOf("pnpm --filter api run deploy:staging")
    ).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("pnpm --filter web run deploy:staging")
    )
    expect(
      stagingDeploymentWorkflow.indexOf("pnpm --filter web run deploy:staging")
    ).toBeLessThan(stagingDeploymentWorkflow.indexOf("pnpm verify:staging"))
    expect(stagingDeploymentWorkflow.indexOf("pnpm db:start")).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("pnpm db:test")
    )
  })
})
