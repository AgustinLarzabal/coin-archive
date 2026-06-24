import { describe, expect, it } from "vitest"

import {
  getCollectorRouteRedirect,
  getEditorRouteAuthorization,
} from "./route-authorization"

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

describe("getEditorRouteAuthorization", () => {
  it("denies signed-in Collectors without editor access", () => {
    expect(getEditorRouteAuthorization({ role: "collector" })).toEqual({
      isAllowed: false,
    })
  })

  it("denies signed-in Collectors without a valid editor role", () => {
    expect(getEditorRouteAuthorization({ role: null })).toEqual({
      isAllowed: false,
    })
    expect(getEditorRouteAuthorization({ role: "owner" })).toEqual({
      isAllowed: false,
    })
  })

  it("allows Editors and Admins", () => {
    expect(getEditorRouteAuthorization({ role: "editor" })).toEqual({
      isAllowed: true,
    })
    expect(getEditorRouteAuthorization({ role: "admin" })).toEqual({
      isAllowed: true,
    })
  })
})
