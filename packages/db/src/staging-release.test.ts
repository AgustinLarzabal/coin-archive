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
    '#!/bin/sh\nprintf "%s\\n" "$*" >> "$STAGING_TEST_LOG"\nif [ "$1" = "db:migrate" ] && [ -z "$DATABASE_URL" ]; then exit 8; fi\nif [ "$1" != "db:migrate" ] && [ -n "$STAGING_DATABASE_URL" ]; then exit 9; fi\nif [ "$1" = "$STAGING_TEST_FAIL" ]; then exit 7; fi\n'
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

  it("migrates only after successful checks and target validation", () => {
    const { result, calls } = runRelease()
    expect(result.status).toBe(0)
    expect(calls).toEqual(["build", "test", "db:migrate"])
  })
})
