import { describe, expect, it } from "vitest"

import {
  getCollectorRouteRedirect,
  getEditorRouteAccess,
} from "./private-route"

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

describe("getEditorRouteAccess", () => {
  it("redirects signed-out visitors to sign in with the intended destination preserved", () => {
    expect(getEditorRouteAccess(null, "/database")).toEqual({
      search: {
        redirect: "/database",
      },
      to: "/login",
    })
  })

  it("denies signed-in Collectors without editor access", () => {
    expect(getEditorRouteAccess({ role: "collector" }, "/database")).toEqual({
      isAllowed: false,
    })
  })

  it("allows Editors and Admins", () => {
    expect(getEditorRouteAccess({ role: "editor" }, "/database")).toEqual({
      isAllowed: true,
    })
    expect(getEditorRouteAccess({ role: "admin" }, "/database")).toEqual({
      isAllowed: true,
    })
  })
})
