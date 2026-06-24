import { describe, expect, it } from "vitest"

import {
  getAuthenticatedLoginRedirect,
  getLocationRedirectTarget,
  getSafeAuthRedirect,
} from "./auth-redirect"

describe("getLocationRedirectTarget", () => {
  it("preserves pathname, search, and hash in router order", () => {
    expect(
      getLocationRedirectTarget({
        hash: "#details",
        pathname: "/coins/coin-1",
        searchStr: "?issuer=spain",
      })
    ).toBe("/coins/coin-1?issuer=spain#details")
  })
})

describe("getSafeAuthRedirect", () => {
  it("keeps safe in-app redirects", () => {
    expect(getSafeAuthRedirect("/coins/coin-1?issuer=spain")).toBe(
      "/coins/coin-1?issuer=spain"
    )
  })

  it("falls back to the catalogue for unsafe redirects", () => {
    expect(getSafeAuthRedirect(undefined)).toBe("/")
    expect(getSafeAuthRedirect("")).toBe("/")
    expect(getSafeAuthRedirect("https://example.com")).toBe("/")
    expect(getSafeAuthRedirect("//example.com")).toBe("/")
    expect(getSafeAuthRedirect("javascript:alert(1)")).toBe("/")
    expect(getSafeAuthRedirect("coins/coin-1")).toBe("/")
  })

  it("redirects signed-in Collectors away from the login page", () => {
    expect(getAuthenticatedLoginRedirect(false, "/coins/coin-1")).toBeNull()
    expect(getAuthenticatedLoginRedirect(true, "/coins/coin-1")).toBe(
      "/coins/coin-1"
    )
    expect(getAuthenticatedLoginRedirect(true, "/login")).toBe("/")
    expect(getAuthenticatedLoginRedirect(true, "https://example.com")).toBe("/")
  })
})
