import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

type PackageManifest = {
  scripts?: Record<string, string>
}

const rootPackage = readPackageManifest("../../../package.json")
const stagingVerificationPackage = readPackageManifest("../package.json")

describe("staging verification commands", () => {
  it("exposes verification commands without test aliases", () => {
    expect(rootPackage.scripts?.["verify:staging"]).toBe(
      "pnpm --filter @coin-archive/staging-verification run verify:staging"
    )
    expect(rootPackage.scripts?.["test:e2e:staging"]).toBeUndefined()
    expect(stagingVerificationPackage.scripts?.["verify:staging"]).toBe(
      "node --import tsx src/staging-verification.ts"
    )
    expect(stagingVerificationPackage.scripts?.["test:staging"]).toBeUndefined()
  })
})

function readPackageManifest(relativePath: string): PackageManifest {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8")
  ) as PackageManifest
}
