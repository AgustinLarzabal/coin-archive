import { spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const releaseScript = fileURLToPath(
  new URL("../scripts/release.mjs", import.meta.url)
)
const sha = "a".repeat(40)
const host = "ep-production.eu-central-1.aws.neon.tech"

function runRelease(overrides: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), "production-release-"))
  const log = join(directory, "calls")
  writeFileSync(
    join(directory, "gh"),
    `#!/bin/sh
case "$*" in
  *branches/main*)
    if [ -f "$TEST_MAIN_CHECKED" ] && [ -n "$TEST_MAIN_AFTER_CHECK" ]; then
      printf '{"commit":{"sha":"%s"}}' "$TEST_MAIN_AFTER_CHECK"
    else
      : > "$TEST_MAIN_CHECKED"
      printf '{"commit":{"sha":"%s"}}' "$TEST_MAIN_SHA"
    fi ;;
  *staging-migrations.yml/runs*) printf '{"workflow_runs":[{"head_sha":"%s","head_branch":"main","event":"push","status":"completed","conclusion":"%s"}]}' "$GITHUB_SHA" "$TEST_STAGING_RESULT" ;;
esac
`
  )
  writeFileSync(
    join(directory, "pnpm"),
    `#!/bin/sh
printf '%s\n' "$*" >> "$TEST_CALLS"
if [ "$*" = "$TEST_FAIL" ]; then exit 7; fi
`
  )
  chmodSync(join(directory, "gh"), 0o755)
  chmodSync(join(directory, "pnpm"), 0o755)
  try {
    const result = spawnSync(
      process.execPath,
      [releaseScript, "--production"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          TEST_CALLS: log,
          TEST_MAIN_SHA: sha,
          TEST_MAIN_CHECKED: join(directory, "main-checked"),
          TEST_STAGING_RESULT: "success",
          GITHUB_ACTIONS: "true",
          GITHUB_EVENT_NAME: "workflow_dispatch",
          GITHUB_REF: "refs/heads/main",
          GITHUB_REPOSITORY: "AgustinLarzabal/coin-archive",
          GITHUB_SHA: sha,
          PRODUCTION_DATABASE_URL: `postgresql://operator:credential-sentinel@${host}/coin_archive?sslmode=require`,
          PRODUCTION_DATABASE_HOST: host,
          PRODUCTION_DATABASE_NAME: "coin_archive",
          PRODUCTION_WEB_ORIGIN: "https://coinarchive.app",
          ...overrides,
        },
      }
    )
    const calls = existsSync(log)
      ? readFileSync(log, "utf8").trim().split("\n")
      : []
    return { result, calls }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe("production promotion", () => {
  it("rejects a dispatch from another branch", () => {
    const { result, calls } = runRelease({ GITHUB_REF: "refs/heads/feature" })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("must start from main")
    expect(calls).toEqual([])
  })

  it("rejects a commit behind current main before any release command", () => {
    const { result, calls } = runRelease({ TEST_MAIN_SHA: "b".repeat(40) })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("no longer current main")
    expect(calls).toEqual([])
  })

  it("rejects a commit without a successful staging release", () => {
    const { result, calls } = runRelease({ TEST_STAGING_RESULT: "failure" })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      "latest staging release for selected commit did not succeed"
    )
    expect(calls).toEqual([])
  })

  it("stops before migration if main advances during preflight", () => {
    const { result, calls } = runRelease({
      TEST_MAIN_AFTER_CHECK: "b".repeat(40),
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("no longer current main")
    expect(calls).toContain("--filter web exec wrangler deploy --dry-run")
    expect(calls).not.toContain("db:migrate")
  })

  it("rejects the wrong production database before migration", () => {
    const { result, calls } = runRelease({ PRODUCTION_DATABASE_NAME: "other" })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("production target check failed")
    expect(result.stderr).not.toContain("credential-sentinel")
    expect(calls).toEqual(["build", "test"])
  })

  it("stops after a failed API deployment without deploying web", () => {
    const { result, calls } = runRelease({
      TEST_FAIL: "--filter api exec wrangler deploy",
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("production API deployment failed")
    expect(calls).toContain("db:migrate")
    expect(calls).not.toContain("--filter web exec wrangler deploy")
    expect(result.stdout).not.toContain("Production release verified")
  })

  it("migrates, deploys and verifies production in order", () => {
    const { result, calls } = runRelease()
    expect(result.status).toBe(0)
    expect(calls).toEqual([
      "build",
      "test",
      "--filter api exec node scripts/check-private-worker.mjs --deploy",
      "--filter api exec node scripts/check-deployed-private-worker.mjs --preflight",
      "--filter web build",
      "--filter api exec wrangler deploy --dry-run",
      "--filter web exec wrangler deploy --dry-run",
      "db:migrate",
      "--filter api exec wrangler deploy",
      "--filter api exec node scripts/check-deployed-private-worker.mjs",
      "--filter web exec wrangler deploy",
      "--filter web check:deployed-archive https://coinarchive.app",
    ])
  })
})
