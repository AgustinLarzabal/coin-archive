import { describe, expect, it } from "vitest"

import { getCollectorRouteRedirect } from "./private-route"

describe("getCollectorRouteRedirect", () => {
  it("redirects signed-out visitors to sign in with the intended destination preserved", () => {
    expect(getCollectorRouteRedirect(false, "/settings")).toEqual({
      search: {
        redirect: "/settings",
      },
      to: "/login",
    })
  })

  it("does not redirect signed-in Collectors", () => {
    expect(getCollectorRouteRedirect(true, "/settings")).toBeNull()
  })
})
