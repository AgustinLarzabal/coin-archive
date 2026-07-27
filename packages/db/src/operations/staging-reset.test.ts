import { describe, expect, it } from "vitest"

import { requireStagingResetWorkflow } from "./staging-reset"

describe("staging reset guard", () => {
  it("allows the reset operation only from the protected staging workflow", () => {
    expect(() =>
      requireStagingResetWorkflow({
        environment: "staging",
        githubActions: "true",
        workflowName: "Reset staging data",
      })
    ).not.toThrow()
  })

  it("refuses production and all invocations outside the protected workflow", () => {
    expect(() =>
      requireStagingResetWorkflow({
        environment: "production",
        githubActions: "true",
        workflowName: "Reset staging data",
      })
    ).toThrow(
      "COIN_ARCHIVE_ENVIRONMENT must be staging"
    )
    expect(() =>
      requireStagingResetWorkflow({
        environment: "staging",
        githubActions: undefined,
        workflowName: "Reset staging data",
      })
    ).toThrow("Reset and reseed is available only from the Reset staging data workflow")
    expect(() =>
      requireStagingResetWorkflow({
        environment: "staging",
        githubActions: "true",
        workflowName: "Deploy production",
      })
    ).toThrow("Reset and reseed is available only from the Reset staging data workflow")
  })
})
