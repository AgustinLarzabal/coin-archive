import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LoginPage } from "./login"

describe("LoginPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("renders Google as the only sign-in method", () => {
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true")

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
