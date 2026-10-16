import { describe, expect, it } from "vitest"

import { resolveApiBaseUrl } from "./config"

describe("web configuration", () => {
  it("accepts and normalizes an explicit HTTPS origin", () => {
    expect(
      resolveApiBaseUrl("  https://api.coin-archive.example/  ", {
        production: true,
      })
    ).toBe("https://api.coin-archive.example")
  })

  it("defaults to the local API outside production", () => {
    expect(resolveApiBaseUrl(undefined, { production: false })).toBe(
      "http://localhost:3001"
    )
  })

  it("requires an explicit origin in production", () => {
    expect(() =>
      resolveApiBaseUrl("   ", { production: true })
    ).toThrow(/VITE_API_BASE_URL.*required.*production/)
  })

  it.each([
    ["malformed", "api.coin-archive.example"],
    ["non-HTTP", "ftp://api.coin-archive.example"],
    ["path", "https://api.coin-archive.example/v1"],
    ["query", "https://api.coin-archive.example?token=value"],
    ["fragment", "https://api.coin-archive.example#fragment"],
  ])("rejects an origin with a %s", (_case, value) => {
    expect(() => resolveApiBaseUrl(value, { production: true })).toThrow(
      /VITE_API_BASE_URL.*HTTP or HTTPS origin without a path/
    )
  })

  it("does not reproduce a rejected value in its diagnostic", () => {
    const value =
      "https://operator:credential-sentinel@api.coin-archive.example"

    expect(() => resolveApiBaseUrl(value, { production: true })).toThrow(
      /VITE_API_BASE_URL/
    )

    try {
      resolveApiBaseUrl(value, { production: true })
    } catch (error) {
      expect(String(error)).not.toContain("credential-sentinel")
      expect(String(error)).not.toContain("operator")
    }
  })
})
