import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { LoginPage } from "./login"

describe("LoginPage", () => {
  it("renders Google as the only sign-in method", () => {
    const markup = renderToStaticMarkup(
      <LoginPage redirectTarget="/coins/coin-1" />
    )

    expect(markup).toContain("Sign in")
    expect(markup).toContain("Continue with Google")
    expect(markup).not.toContain("GitHub")
    expect(markup).not.toContain("Apple")
    expect(markup).not.toContain("Email")
  })
})
