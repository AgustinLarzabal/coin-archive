import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const stagingDeploymentWorkflow = readFileSync(
  fileURLToPath(
    new URL("../../../../.github/workflows/deploy-staging.yml", import.meta.url)
  ),
  "utf8"
)

const requiredReleaseConfiguration = [
  "DATABASE_URL",
  "CLOUDFLARE_API_TOKEN",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "VITE_AUTH_GOOGLE_ENABLED",
  "VITE_SHOW_SIGN_IN_BUTTON",
]

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
      "name: Validate release configuration"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "VITE_SHOW_SIGN_IN_BUTTON: ${{ vars.VITE_SHOW_SIGN_IN_BUTTON }}"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter web run deploy:staging"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter api run deploy:staging"
    )
    const preflight = stagingDeploymentWorkflow.indexOf(
      "name: Validate release configuration"
    )
    const migrate = stagingDeploymentWorkflow.indexOf("pnpm db:migrate")
    const preflightBlock = stagingDeploymentWorkflow.slice(preflight, migrate)
    const validationLoop = preflightBlock.slice(
      preflightBlock.indexOf("for name in"),
      preflightBlock.indexOf("\n          do")
    )
    const install = stagingDeploymentWorkflow.lastIndexOf(
      "pnpm install --frozen-lockfile",
      preflight
    )
    const apiSecretUpload = stagingDeploymentWorkflow.indexOf(
      "pnpm --filter api exec wrangler secret bulk --env staging"
    )
    const webSecretUpload = stagingDeploymentWorkflow.indexOf(
      "pnpm --filter web exec wrangler secret bulk --env staging"
    )
    const apiDeploy = stagingDeploymentWorkflow.indexOf(
      "pnpm --filter api run deploy:staging"
    )
    const webDeploy = stagingDeploymentWorkflow.indexOf(
      "pnpm --filter web run deploy:staging"
    )

    expect(apiSecretUpload).toBeGreaterThan(-1)
    expect(webSecretUpload).toBeGreaterThan(-1)
    expect(validationLoop.match(/[A-Z][A-Z0-9_]+/g)).toEqual(
      requiredReleaseConfiguration
    )
    expect(preflightBlock).not.toMatch(/VITE_\w+.*(?:==|!=)\s*true/)
    expect(stagingDeploymentWorkflow).not.toContain("--env production")
    expect(stagingDeploymentWorkflow).not.toContain("deploy:production")
    expect(stagingDeploymentWorkflow).not.toContain(
      "configure:r2-lifecycle:production"
    )
    expect(stagingDeploymentWorkflow).toContain(
      "pnpm --filter api run configure:r2-lifecycle:staging"
    )
    expect(stagingDeploymentWorkflow).not.toMatch(/\b(?:reset|seed)\b/i)

    expect(install).toBeLessThan(preflight)
    expect(preflight).toBeLessThan(migrate)
    expect(migrate).toBeLessThan(apiSecretUpload)
    expect(migrate).toBeLessThan(webSecretUpload)
    expect(apiSecretUpload).toBeLessThan(apiDeploy)
    expect(apiSecretUpload).toBeLessThan(webDeploy)
    expect(webSecretUpload).toBeLessThan(apiDeploy)
    expect(webSecretUpload).toBeLessThan(webDeploy)
    expect(apiSecretUpload).toBeLessThan(
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
      apiDeploy
    ).toBeLessThan(
      webDeploy
    )
    expect(
      webDeploy
    ).toBeLessThan(stagingDeploymentWorkflow.indexOf("pnpm verify:staging"))
    expect(stagingDeploymentWorkflow.indexOf("pnpm db:start")).toBeLessThan(
      stagingDeploymentWorkflow.indexOf("pnpm db:test")
    )
  })
})
