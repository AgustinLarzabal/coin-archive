import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const wranglerConfig = readFileSync(
  fileURLToPath(new URL("../wrangler.jsonc", import.meta.url)),
  "utf8"
)

describe("web deployment configuration", () => {
  it("sets the public API environment in every deployed Worker", () => {
    for (const environment of ["staging", "production"]) {
      expect(wranglerConfig).toMatch(
        new RegExp(
          `"${environment}": \\{[\\s\\S]*?"CLOUDFLARE_ENV": "${environment}"`
        )
      )
    }
  })

  it("binds a separate sign-in rate limiter in every environment", () => {
    expect(wranglerConfig.indexOf('"ratelimits"')).toBeLessThan(
      wranglerConfig.indexOf('"env"')
    )

    for (const environment of ["staging", "production"]) {
      expect(wranglerConfig).toMatch(
        new RegExp(
          `"${environment}": \\{[\\s\\S]*?"ratelimits": \\[\\s*\\{\\s*"name": "AUTH_RATE_LIMITER"`
        )
      )
    }
  })
})
