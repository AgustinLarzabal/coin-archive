import { describe, expect, it } from "vitest"

import { createSessionRequestHeaders } from "./auth-session-request-headers"

describe("createSessionRequestHeaders", () => {
  it("forwards session credentials without server-function JSON transport headers", () => {
    const headers = createSessionRequestHeaders(
      new Headers({
        Accept: "application/x-tss-framed, application/json",
        "Content-Type": "application/json",
        Cookie: "better-auth.session_token=session-token",
        "User-Agent": "Coin Archive test browser",
        "X-TSR-ServerFn": "true",
      })
    )

    expect(Object.fromEntries(headers)).toStrictEqual({
      cookie: "better-auth.session_token=session-token",
      "user-agent": "Coin Archive test browser",
    })
  })
})
