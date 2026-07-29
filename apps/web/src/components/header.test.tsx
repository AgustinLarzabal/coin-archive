import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Header } from "./header"

const authState = vi.hoisted(() => ({ session: null as object | null }))

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/login">{children}</a>,
  useRouterState: ({
    select,
  }: {
    select: (state: {
      location: { hash: string; pathname: string; searchStr: string }
    }) => string
  }) =>
    select({
      location: { hash: "", pathname: "/", searchStr: "" },
    }),
}))

vi.mock("@workspace/auth/client", () => ({
  authClient: {
    useSession: () => ({ data: authState.session }),
  },
}))

vi.mock("./user-menu", () => ({
  UserMenu: () => <span>Collector menu</span>,
}))

describe("Header", () => {
  afterEach(() => {
    authState.session = null
    vi.unstubAllEnvs()
  })

  it("shows Sign in to an unauthenticated person by default", () => {
    expect(renderToStaticMarkup(<Header />)).toContain("Sign in")
  })

  it("hides Sign in from an unauthenticated person when configured", () => {
    vi.stubEnv("VITE_SHOW_SIGN_IN_BUTTON", "false")

    expect(renderToStaticMarkup(<Header />)).not.toContain("Sign in")
  })

  it("shows the Collector menu to a signed-in Collector regardless of the flag", () => {
    authState.session = {}
    vi.stubEnv("VITE_SHOW_SIGN_IN_BUTTON", "false")

    const markup = renderToStaticMarkup(<Header />)

    expect(markup).toContain("Collector menu")
    expect(markup).not.toContain("Sign in")
  })
})
