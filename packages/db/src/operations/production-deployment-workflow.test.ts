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
      "name: Validate release configuration"
    )
    expect(productionDeploymentWorkflow).toContain(
      "VITE_SHOW_SIGN_IN_BUTTON: ${{ vars.VITE_SHOW_SIGN_IN_BUTTON }}"
    )
    expect(productionDeploymentWorkflow).toContain(
      "pnpm --filter web run deploy:production"
    )
    expect(productionDeploymentWorkflow).toContain(
      "pnpm --filter api run deploy:production"
    )
    const preflight = productionDeploymentWorkflow.indexOf(
      "name: Validate release configuration"
    )
    const migrate = productionDeploymentWorkflow.indexOf("pnpm db:migrate")
    const preflightBlock = productionDeploymentWorkflow.slice(
      preflight,
      migrate
    )
    const validationLoop = preflightBlock.slice(
      preflightBlock.indexOf("for name in"),
      preflightBlock.indexOf("\n          do")
    )
    const install = productionDeploymentWorkflow.lastIndexOf(
      "pnpm install --frozen-lockfile",
      preflight
    )
    const apiSecretUpload = productionDeploymentWorkflow.indexOf(
      "pnpm --filter api exec wrangler secret bulk --env production"
    )
    const webSecretUpload = productionDeploymentWorkflow.indexOf(
      "pnpm --filter web exec wrangler secret bulk --env production"
    )
    const apiDeploy = productionDeploymentWorkflow.indexOf(
      "pnpm --filter api run deploy:production"
    )
    const webDeploy = productionDeploymentWorkflow.indexOf(
      "pnpm --filter web run deploy:production"
    )

    expect(apiSecretUpload).toBeGreaterThan(-1)
    expect(webSecretUpload).toBeGreaterThan(-1)
    expect(validationLoop.match(/[A-Z][A-Z0-9_]+/g)).toEqual(
      requiredReleaseConfiguration
    )
    expect(preflightBlock).not.toMatch(/VITE_\w+.*(?:==|!=)\s*true/)
    expect(productionDeploymentWorkflow).not.toContain("--env staging")
    expect(productionDeploymentWorkflow).not.toContain("deploy:staging")
    expect(productionDeploymentWorkflow).not.toContain(
      "configure:r2-lifecycle:staging"
    )
    expect(productionDeploymentWorkflow).toContain(
      "pnpm --filter api run configure:r2-lifecycle:production"
    )
    expect(productionDeploymentWorkflow).not.toMatch(/\b(?:reset|seed)\b/i)
    expect(productionDeploymentWorkflow).not.toMatch(/environment: staging/)

    expect(install).toBeLessThan(preflight)
    expect(preflight).toBeLessThan(migrate)
    expect(migrate).toBeLessThan(apiSecretUpload)
    expect(migrate).toBeLessThan(webSecretUpload)
    expect(apiSecretUpload).toBeLessThan(apiDeploy)
    expect(apiSecretUpload).toBeLessThan(webDeploy)
    expect(webSecretUpload).toBeLessThan(apiDeploy)
    expect(webSecretUpload).toBeLessThan(webDeploy)
    expect(apiSecretUpload).toBeLessThan(
      productionDeploymentWorkflow.indexOf(
        "pnpm --filter api run configure:r2-lifecycle:production"
      )
    )
    expect(
      productionDeploymentWorkflow.indexOf(
        "pnpm --filter api run configure:r2-lifecycle:production"
      )
    ).toBeLessThan(
      productionDeploymentWorkflow.indexOf(
        "pnpm --filter api run deploy:production"
      )
    )
    expect(
      apiDeploy
    ).toBeLessThan(
      webDeploy
    )
  })
})
