import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const wranglerConfig = readFileSync(
  fileURLToPath(new URL("../wrangler.jsonc", import.meta.url)),
  "utf8"
)

describe("API deployment configuration", () => {
  it("binds the rate limiter in local development and every deployed environment", () => {
    expect(wranglerConfig.indexOf('"ratelimits"')).toBeLessThan(
      wranglerConfig.indexOf('"env"')
    )

    for (const environment of ["staging", "production"]) {
      expect(wranglerConfig).toMatch(
        new RegExp(
          `"${environment}": \\{[\\s\\S]*?"ratelimits": \\[\\s*\\{\\s*"name": "API_RATE_LIMITER"`
        )
      )
    }
  })

  it("configures the API auth origin and matching trusted web origin", () => {
    expect(wranglerConfig).toContain(
      '"BETTER_AUTH_URL": "https://api.staging.coinarchive.app"'
    )
    expect(wranglerConfig).toContain(
      '"BETTER_AUTH_TRUSTED_ORIGINS": "https://staging.coinarchive.app"'
    )
    expect(wranglerConfig).toContain(
      '"BETTER_AUTH_URL": "https://api.coinarchive.app"'
    )
    expect(wranglerConfig).toContain(
      '"BETTER_AUTH_TRUSTED_ORIGINS": "https://coinarchive.app"'
    )
  })
})
