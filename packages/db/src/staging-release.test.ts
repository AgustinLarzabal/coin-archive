import { spawnSync } from "node:child_process"
import {
  chmodSync,
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
  new URL("../scripts/staging-release.mjs", import.meta.url)
)
const host = "ep-example.eu-central-1.aws.neon.tech"

function runRelease(overrides: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), "staging-release-"))
  const command = join(directory, "pnpm")
  const log = join(directory, "calls")
  writeFileSync(
    command,
    '#!/bin/sh\nprintf "%s\\n" "$*" >> "$STAGING_TEST_LOG"\nif [ "$1" = "db:migrate" ] && [ -z "$DATABASE_URL" ]; then exit 8; fi\nif [ "$1" != "db:migrate" ] && [ -n "$STAGING_DATABASE_URL" ]; then exit 9; fi\nif [ "$*" = "$STAGING_TEST_FAIL" ]; then exit 7; fi\n'
  )
  chmodSync(command, 0o755)

  try {
    const result = spawnSync(process.execPath, [releaseScript], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        STAGING_TEST_LOG: log,
        STAGING_DATABASE_URL: `postgresql://operator:credential-sentinel@${host}/coin_archive_staging?sslmode=require`,
        STAGING_DATABASE_HOST: host,
        STAGING_DATABASE_NAME: "coin_archive_staging",
        STAGING_WEB_ORIGIN:
          "https://coin-archive-web-staging.example.workers.dev",
        GITHUB_SHA: "abc123",
        ...overrides,
      },
    })
    return { result, calls: readFileSync(log, "utf8").trim().split("\n") }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe("staging release", () => {
  it("stops before migration when the configured target is wrong", () => {
    const { result, calls } = runRelease({
      STAGING_DATABASE_NAME: "other_database",
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("staging target check failed")
    expect(result.stderr).not.toContain("credential-sentinel")
    expect(calls).toEqual(["build", "test"])
  })

  it("stops before migration when a check fails", () => {
    const { result, calls } = runRelease({ STAGING_TEST_FAIL: "test" })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("deterministic tests failed")
    expect(calls).toEqual(["build", "test"])
  })

  it("deploys and checks the staging Workers in order after migration", () => {
    const { result, calls } = runRelease()
    expect(result.status).toBe(0)
    expect(calls).toEqual([
      "build",
      "test",
      "--filter api exec node scripts/check-private-worker.mjs --deploy --staging",
      "--filter api exec node scripts/check-deployed-private-worker.mjs --preflight",
      "--filter web build",
      "--filter api exec wrangler deploy --env staging --dry-run",
      "--filter web exec wrangler deploy --env staging --dry-run",
      "db:migrate",
      "--filter api exec wrangler deploy --env staging",
      "--filter api exec node scripts/check-deployed-private-worker.mjs --staging",
      "--filter web exec wrangler deploy --env staging",
      "--filter web check:deployed-archive https://coin-archive-web-staging.example.workers.dev --staging",
    ])
    expect(result.stdout).toContain(
      "Staging release verified for commit abc123"
    )
  })

  it("stops before migration when a deployment dry run fails", () => {
    const { result, calls } = runRelease({
      STAGING_TEST_FAIL:
        "--filter web exec wrangler deploy --env staging --dry-run",
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("web deployment dry run failed")
    expect(calls).not.toContain("db:migrate")
  })

  it("stops after migration when the API deployment fails", () => {
    const { result, calls } = runRelease({
      STAGING_TEST_FAIL: "--filter api exec wrangler deploy --env staging",
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("staging API deployment failed")
    expect(calls).toContain("db:migrate")
    expect(calls).not.toContain("--filter web exec wrangler deploy --env staging")
    expect(result.stdout).not.toContain("Staging release verified")
  })

  it("reports a deployed check failure without marking the release successful", () => {
    const { result, calls } = runRelease({
      STAGING_TEST_FAIL:
        "--filter web check:deployed-archive https://coin-archive-web-staging.example.workers.dev --staging",
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("deployed Archive browser failed")
    expect(result.stdout).not.toContain("Staging release verified")
    expect(calls).toContain("db:migrate")
  })
})
